import {EventTopic} from "./mems-queue.js";

export class ECUCommand {
    id;
    topic;
    command;
    responseSize;
    constructor(id, topic, command, responseSize) {
        this.id = id;
        this.topic = topic;
        this.command = command;
        this.responseSize = responseSize;
    }
}

export const MEMS_KLineInitWakeup = new ECUCommand(0, EventTopic.Initialisation, 0x00, 3);
export const MEMS_KLineInitComplete = new ECUCommand(0, EventTopic.Initialisation, 0x7C, 2);
export const MEMS_KLineInitEcho = new ECUCommand(0, EventTopic.Initialisation, 0x55, 3);
export const MEMS_InitA = new ECUCommand(0, EventTopic.Initialisation, 0xca, 1);
export const MEMS_InitB = new ECUCommand(0, EventTopic.Initialisation, 0x75, 1);
export const MEMS_ECUId = new ECUCommand(0, EventTopic.Initialisation, 0xd0, 5);

export const MEMS_Heartbeat = new ECUCommand(0, EventTopic.Heartbeat, 0xf4, 2);
export const MEMS_Dataframe80 = new ECUCommand(0, EventTopic.Dataframe, 0x80, 29);
export const MEMS_Dataframe7d = new ECUCommand(0, EventTopic.Dataframe, 0x7d, 33);

export const MEMS_ClearFaults = new ECUCommand(0, EventTopic.Reset, 0xcc, 2);
export const MEMS_ResetECU = new ECUCommand(0, EventTopic.Reset, 0xfa, 2);

// activate actuators
export const MEMS_CoolantGauge_Activate = new ECUCommand(0, EventTopic.Actuator, 0x10, 2);
export const MEMS_CoolantGauge_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x00, 2);

export const MEMS_FuelPump_Activate = new ECUCommand(0, EventTopic.Actuator, 0x11, 2);
export const MEMS_FuelPump_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x01, 2);

export const MEMS_PTC_Activate = new ECUCommand(0, EventTopic.Actuator, 0x12, 2);
export const MEMS_PTC_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x02, 2);

export const MEMS_AirCon_Activate = new ECUCommand(0, EventTopic.Actuator, 0x13, 2);
export const MEMS_AirCon_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x03, 2);

export const MEMS_PurgeValve_Activate = new ECUCommand(0, EventTopic.Actuator, 0x18, 2);
export const MEMS_PurgeValve_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x08, 2);

export const MEMS_LambdaHeater_Activate = new ECUCommand(0, EventTopic.Actuator, 0x19, 2);
export const MEMS_LambdaHeater_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x09, 2);

export const MEMS_Fan1_Activate = new ECUCommand(0, EventTopic.Actuator, 0x1d, 2);
export const MEMS_Fan1_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x0d, 2);

export const MEMS_Fan2_Activate = new ECUCommand(0, EventTopic.Actuator, 0x1e, 2);
export const MEMS_Fan2_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x0e, 2);

export const MEMS_Injector_Activate = new ECUCommand(0, EventTopic.Actuator, 0xf7, 2);
export const MEMS_Coil_Activate = new ECUCommand(0, EventTopic.Actuator, 0xf8, 2);

export const MEMS_RPMGauge_Activate = new ECUCommand(0, EventTopic.Actuator, 0x63, 1);
export const MEMS_RPMGauge_Deactivate = new ECUCommand(0, EventTopic.Actuator, 0x60, 1);

export const MEMS_STFT_Dec = new ECUCommand(0, EventTopic.Adjustment, 0x7a, 2);
export const MEMS_STFT_Inc = new ECUCommand(0, EventTopic.Adjustment, 0x79, 2);
export const MEMS_LTFT_Dec = new ECUCommand(0, EventTopic.Adjustment, 0x7c, 2);
export const MEMS_LTFT_Inc = new ECUCommand(0, EventTopic.Adjustment, 0x7b, 2);
export const MEMS_HotIdle_Dec = new ECUCommand(0, EventTopic.Adjustment, 0x8a, 2);
export const MEMS_HotIdle_Inc = new ECUCommand(0, EventTopic.Adjustment, 0x89, 2);
export const MEMS_IdleSpeed_Dec = new ECUCommand(0, EventTopic.Adjustment, 0x92, 2);
export const MEMS_IdleSpeed_Inc = new ECUCommand(0, EventTopic.Adjustment, 0x91, 2);
export const MEMS_IgnAdvance_Dec = new ECUCommand(0, EventTopic.Adjustment, 0x94, 2);
export const MEMS_IgnAdvance_Inc = new ECUCommand(0, EventTopic.Adjustment, 0x93, 2);
export const MEMS_IAC_Dec = new ECUCommand(0, EventTopic.Adjustment, 0xfe, 2);
export const MEMS_IAC_Inc = new ECUCommand(0, EventTopic.Adjustment, 0xfd, 2);

//export const MEMS_ = new ECUCommand(0, EventTopic, 0x, 2);
