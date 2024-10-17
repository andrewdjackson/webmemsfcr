export const StatusFault = "alert";
export const StatusWarning = "warning";
export const StatusInfo = "info";
export class Fault {
    id;
    title;
    count;
    level;

    constructor(id, title, level) {
        this.id = id;
        this.title = title;
        this.level = level
    }
}

export const O2Fault = new Fault("o2_system_fault", "O2 System Fault", StatusFault);
export const MapFault = new Fault("map_fault", "MAP Reading Too High", StatusFault);
export const CoolantFault = new Fault("coolant_temperature_fault", "Coolant Sensor Fault", StatusFault);
export const AirTempFault = new Fault("inlet_air_temp_sensor_fault", "Inlet Air Temperature Sensor Fault", StatusWarning);
export const FuelPumpFault = new Fault("fuel_pump_circuit_fault", "Fuel Pump Fault", StatusFault);
export const ThrottleFault = new Fault("throttle_pot_circuit_fault", "Throttle Pot. Fault", StatusFault);
export const IdleFault = new Fault("idle_fault", "Idle Fault when Cold", StatusFault);
export const IdleHotFault = new Fault("idle_hot_fault", "Hot Idle Fault", StatusWarning);
export const IdleSpeedFault = new Fault("idle_speed_fault", "Idle Speed Control Fault", StatusWarning);
export const IACFault = new Fault("iac_fault", "Stepper Motor (IACV) Fault", StatusFault);
export const VacuumFault = new Fault("vacuum_fault", "Possible Vacuum Leak", StatusFault);
export const BatteryFault = new Fault("battery_fault", "Battery Voltage Low", StatusFault);
export const ThermostatFault = new Fault("thermostat_fault", "Possible Thermostat Fault", StatusFault);
export const JackFault = new Fault("iac_jack_fault", "ECU Reaching IAC Stepper Motor Limits (Jack Count High)", StatusWarning);
export const CrankshaftFault = new Fault("crankshaft_position_sensor_fault", "Possible Crankshaft Position Sensor Fault", StatusWarning);
export const CoilFault = new Fault("coil_fault", "Coil Timing High", StatusInfo);
export const AtOperatingTemp = new Fault("at_operating_temp", "Operating Temp. Reached", StatusInfo);
export const ClosedLoop = new Fault("closed_loop", "Closed Loop Active", StatusInfo);
