// Description: MEMS 2J CAN commands

import {EventTopic} from "./mems-queue.js";
import {ECUCommand} from "./mems-commands.js";

export class UDSRequest extends ECUCommand {
    constructor(id, topic, command, data, responseSize) {
        super(id, topic, command, responseSize);

        this.id = id;

        this.command = [];

        this.length = command.length + data.length;
        this.command.push(this.length);

        this.serviceId = command[0];
        this.command.push(this.serviceId);

        this.subFunction = command[1];
        this.command.push(this.subFunction);

        if (command.length > 2) {
            this.data = command.slice(2);
        } else {
            this.data = data;
        }

        this.command = [...this.command, ...this.data];

        this.checksum = this._calculateChecksum(this.command);
        this.command.push(this.checksum);
    }

    isValid() {
        const checksum = this._calculateChecksum(this.command);
        if (this.checksum === this.command[this.command.length-1]) {
            return true;
        }
    }
    _calculateChecksum(bytes) {
        let sum_checksum = 0;
        for (let i=0; i<bytes.length; i++) {
            sum_checksum += bytes[i];
        }
        return sum_checksum & 0xFF;
    }
}

export class UDSResponse extends UDSRequest {
    constructor(topic, response) {
        super(0, topic, response, 0);

        if (response.length > 3) {
            this.data = response.slice(2, response.length - 1);
        }

        this.checksum = response[response.length-1];
    }
}

export const MEMS2J_Authentication = {
    INITIALISE         : [0x81, 0x13, 0xF7, 0x81, 0x0C],
    AUTHENTICATE       : [0x27, 0x01],
    SEED_RESPONSE      : [0x67, 0x01],
    SEND_KEY           : [0x27, 0x02],
    SEND_KEY_RESPONSE  : [0x67, 0x02],
    INITIALISATION_COMPLETE : [0x03, 0xC1, 0xD5, 0x8F, 0x28],
    }

export const MEMS2J_Diagnostics = {
    INITIATE_DIAGNOSTICS : [0x10, 0xA0],
    DIAGNOSTICS_RESPONSE : [0x50],
    CLEAR_FAULTS         : [0x31, 0xCB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    CLEAR_FAULTS_RESPONSE: [0x71, 0xCB],
    HEARTBEAT            : [0x3E, 0x01],
    HEARTBEAT_RESPONSE   : [0x7E],
}

export const MEMS2J_Actuators = {
    RESPONSE                  : [0x70],
    FUEL_PUMP_ACTIVATE        : [0x30, 0xA1, 0xff],
    FUEL_PUMP_DEACTIVATE      : [0x30, 0xA1, 0xf0],
    AIR_CON_ACTIVATE          : [0x30, 0xA3, 0xff],
    AIR_CON_DEACTIVATE        : [0x30, 0xA3, 0xf0],
    TEST_FAN1_ACTIVATE        : [0x30, 0xA4, 0xff],
    TEST_FAN1_DEACTIVATE      : [0x30, 0xA4, 0xf0],
    LAMBDA_HEATER_ACTIVATE    : [0x30, 0xA6, 0xff],
    LAMBDA_HEATER_DEACTIVATE  : [0x30, 0xA6, 0xf0],
    PURGE_VALVE_ACTIVATE      : [0x30, 0xB1, 0xff, 0x13, 0x88],
    PURGE_VALVE_DEACTIVATE    : [0x30, 0xB1, 0xf0, 0x13, 0x88],
    RPM_GAUGE_ACTIVATE        : [0x30, 0xB7, 0xff],
    RPM_GAUGE_DEACTIVATE      : [0x30, 0xB7, 0xf0],
    LAMBDA_HEATER2_ACTIVATE   : [0x30, 0xC3, 0xff],
    LAMBDA_HEATER2_DEACTIVATE : [0x30, 0xC3, 0xf0],
}

export const MEMS2J_Dataframes = {
    RESPONSE                  : [0x61],
    SEQUENCE                  : [0x00, 0x01, 0x02, 0x03, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0C, 0x0D, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x19, 0x21, 0x25, 0x3A],
    DATAFRAME1                : [0x21, 0x00],
    COOLANT_TEMPERATURE       : [0x21, 0x01],
    OIL_TEMPERATURE           : [0x21, 0x02],
    AIR_INTAKE_TEMPERATURE    : [0x21, 0x03],
    FUEL_TEMPERATURE          : [0x21, 0x05],
    DATAFRAME6                : [0x21, 0x06],
    MAP                       : [0x21, 0x07],
    THROTTLE_POSITION         : [0x21, 0x08],
    ENGINE_RPM                : [0x21, 0x09],
    LAMBDA_VOLTAGE            : [0x21, 0x0A],
    COIL_CHARGE               : [0x21, 0x0B],
    INJECTOR_PULSEWIDTH       : [0x21, 0x0C],
    SPEED                     : [0x21, 0x0D],
    THROTTLE_SWITCH           : [0x21, 0x0F],
    BATTERY_VOLTAGE           : [0x21, 0x10],
    CRANKSHAFT_POSITION       : [0x21, 0x11],
    IAC_STEPPER_POSITION      : [0x21, 0x12],
    CLOSED_LOOP               : [0x21, 0x13],
    FAULTS                    : [0x21, 0x19],
    RPM_ERROR                 : [0x21, 0x21],
    AP1_AP2_PRESSURE          : [0x21, 0x23],
    CAM_POSITION              : [0x21, 0x25],
    ECU_ID                    : [0x21, 0x32],
    IGNITION_TIMING_OFFSET    : [0x21, 0x3A],
}

export const MESM2J_Faults = {
    RESPONSE                            : [0x19],
    // Byte 4
    LOW_VOLTAGE                         : [0b00000001],
    COOLANT_TEMPERATURE_LOW_VOLTAGE     : [0b00000100],
    OIL_TEMPERATURE_LOW_VOLTAGE         : [0b00010000],
    PSU_LOW_VOLTAGE                     : [0b00100000],
    AMBIENT_AIR_TEMPERATURE_LOW_VOLTAGE : [0b01000000],
    // Byte 5
    MAP_SENSOR_LOW_VOLTAGE              : [0b00000001],
    AIR_INTAKE_TEMPERATURE_LOW_VOLTAGE  : [0b00000010],
    THROTTLE_POSITION_LOW_VOLTAGE       : [0b00000100],
    LAMBDA_LOW_VOLTAGE                  : [0b00010000],
    BATTERY_LOW_VOLTAGE                 : [0b10000000],
    // Byte 8
    HIGH_VOLTAGE                        : [0b1],
    COOLANT_TEMPERATURE_HIGH_VOLTAGE    : [0b100],
    OIL_TEMPERATURE_HIGH_VOLTAGE        : [0b10000],
    PSU_HIGH_VOLTAGE                    : [0b100000],
    AMBIENT_AIR_TEMPERATURE_HIGH_VOLTAGE: [0b1000000],
    // Byte 9
    MAP_SENSOR_HIGH_VOLTAGE             : [0b1],
    AIR_INTAKE_TEMPERATURE_HIGH_VOLTAGE : [0b10],
    THROTTLE_POSITION_HIGH_VOLTAGE      : [0b100],
    LAMBDA_HIGH_VOLTAGE                 : [0b10000],
    BATTERY_HIGH_VOLTAGE                : [0b10000000],
    // Byte 12
    VOLTAGE_FAULT                       : [0b1],
    COOLANT_TEMPERATURE_FAULT           : [0b100],
    OIL_TEMPERATURE_FAULT               : [0b10000],
    PSU_FAULT                           : [0b100000],
    AMBIENT_AIR_TEMPERATURE_FAULT       : [0b1000000],
    // Byte 13
    MAP_SENSOR_FAULT                    : [0b1],
    AIR_INTAKE_TEMPERATURE_FAULT        : [0b10],
    THROTTLE_POSITION_FAULT             : [0b100],
    LAMBDA_FAULT                        : [0b10000],
    BATTERY_FAULT                       : [0b10000000],
}
