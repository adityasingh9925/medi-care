import axios from "axios";

const DAILY_API_URL = "https://api.daily.co/v1";
const dailyApi = axios.create({
  baseURL: DAILY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getDailyApiKey = () => {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not configured");
  }

  return apiKey;
};

export const createDailyRoom = async (
  roomName: string,
  scheduledAt: Date,
) => {
  const apiKey = getDailyApiKey();

  const scheduledTimestamp =
    Math.floor(scheduledAt.getTime() / 1000);

  const expirationTimestamp =
    scheduledTimestamp + 2 * 60 * 60;

  const response = await dailyApi.post(
    "/rooms",
    {
      name: roomName,
      privacy: "private",
      properties: {
        nbf: scheduledTimestamp - 15 * 60,
        exp: expirationTimestamp,
        max_participants: 2,
        enable_prejoin_ui: true,
        enable_chat: false,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  return {
    roomName: response.data.name,
    roomUrl: response.data.url,
  };
};

export const createDailyMeetingToken = async (
  roomName: string,
  userId: string,
  userName: string,
  scheduledAt: Date,
) => {
  const apiKey = getDailyApiKey();

  const scheduledTimestamp =
    Math.floor(scheduledAt.getTime() / 1000);

  const expirationTimestamp =
    scheduledTimestamp + 2 * 60 * 60;

  const response = await dailyApi.post(
    "/meeting-tokens",
    {
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        nbf: scheduledTimestamp - 15 * 60,
        exp: expirationTimestamp,
        eject_at_token_exp: true,
        is_owner: false,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  return response.data.token;
};
