import {EventTopic} from "./mems-queue.js";
import {ECUCommand} from "./mems-ecureader.js";

export const MEMS_Heartbeat = new ECUCommand(0, EventTopic.Heartbeat, 0xf4, 1);
export const MEMS_Dataframe80 = new ECUCommand(0, EventTopic.Dataframe, 0x80, 29);
export const MEMS_Dataframe7d = new ECUCommand(0, EventTopic.Dataframe, 0x7d, 33);
