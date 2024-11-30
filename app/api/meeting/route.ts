import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../auth/[...nextauth]/route";
import { PARTICIPANT_ROLE } from "@/components/utils/constant";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // comment if you need to test api on postman
    const session = await auth();

    if (!session?.user?.id) {
      console.log("No session user ID"); // Add this
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const meetingId = searchParams.get("meetingId");

    // fetch meeting detail
    if (meetingId) {
      try {
        const meeting = await prisma.meeting.findUnique({
          where: {
            id: meetingId,
          },
          include: {
            participants: {
              include: {
                user: true,
              },
            },
            availableSlots: true,
          },
        });

        if (!meeting) {
          return NextResponse.json(
            { error: "Meeting not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ meeting });
      } catch (error) {
        console.log("Error getting meeting:", error);
        return NextResponse.json(
          {
            error: "Failed to get meeting",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      } finally {
        await prisma.$disconnect();
      }
    }

    // fetch meetings data of user
    if (userId) {
      try {
        const [hostedMeeting, joinedMeeting, stats] = await Promise.all([
          // hosted meeting
          prisma.meeting.findMany({
            where: {
              participants: {
                some: {
                  userId: userId,
                  role: PARTICIPANT_ROLE.OWNER,
                },
              },
            },
            include: {
              participants: {
                include: {
                  user: true,
                },
              },
              availableSlots: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
          //joined meeting
          prisma.meeting.findMany({
            where: {
              participants: {
                some: {
                  userId: userId,
                  role: PARTICIPANT_ROLE.PARTICIPANT,
                },
              },
            },
            include: {
              participants: {
                include: {
                  user: true,
                },
              },
              availableSlots: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
          // stats
          prisma.meeting.groupBy({
            where: {
              OR: [
                {
                  participants: {
                    some: {
                      userId: userId,
                      role: PARTICIPANT_ROLE.OWNER,
                    },
                  },
                },
                {
                  participants: {
                    some: {
                      userId: userId,
                      role: PARTICIPANT_ROLE.PARTICIPANT,
                    },
                  },
                },
              ],
            },
            by: ["status"],
            _count: {
              id: true,
            },
          }),
        ]);

        const statsResult = {
          hostedMeeting: await prisma.meeting.count({
            where: {
              participants: {
                some: {
                  userId: userId,
                  role: PARTICIPANT_ROLE.OWNER,
                },
              },
            },
          }),
          joinedMeeting: await prisma.meeting.count({
            where: {
              participants: {
                some: {
                  userId: userId,
                  role: PARTICIPANT_ROLE.PARTICIPANT,
                },
              },
            },
          }),
          arrangingMeeting:
            stats.find((stat: any) => stat.status === "PUBLISHED")?._count
              ?.id || 0,
          scheduledMeeting:
            stats.find((stat: any) => stat.status === "SCHEDULED")?._count
              ?.id || 0,
        };

        return NextResponse.json({
          hostedMeeting,
          joinedMeeting,
          stats: statsResult,
        });
      } catch (error) {
        console.log("Error getting meeting:", error);
        return NextResponse.json(
          {
            error: "Failed to get meeting",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {}
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetingData = await req.json();

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: meetingData.title,
        description: meetingData.description || null,
        meetingType: meetingData.meetingType,
        location: meetingData.location || null,
        note: meetingData.note || null,
        dateType: meetingData.dateType,
        proposedDates: meetingData.proposedDates.map(
          (date: string) => new Date(date)
        ),
        status: meetingData.status,

        // Create participants
        participants: {
          create: [
            // map user
            {
              userId: session.user.id,
              role: "OWNER",
            },
            // future feature that can add participants from start
            ...(meetingData.participants || [])
              .filter(
                (participant: { userId: string }) =>
                  participant.userId !== session.user.id
              )
              .map((participant: any) => ({
                userId: participant.userId,
                role: participant.role || "PARTICIPANT",
              })),
          ],
        },

        // Create available slots
        availableSlots: {
          create: meetingData.availableSlots.map((slot: any) => ({
            userId: session?.user?.id,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeZone: slot.timeZone,
          })),
        },
      },
      include: {
        participants: true,
        availableSlots: true,
      },
    });

    return NextResponse.json(
      {
        meeting,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meeting:", error);

    return NextResponse.json(
      {
        error: "Failed to create meeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}