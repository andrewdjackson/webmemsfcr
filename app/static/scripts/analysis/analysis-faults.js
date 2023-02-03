export const StatusFault = "alert";
export const StatusInfo = "info";
export class Fault {
    metric;
    title;
    count;
    level;

    constructor(metric, title, level) {
        this.metric = metric;
        this.title = title;
        this.level = level
    }
}

export const O2Fault = new Fault("o2_system_fault", "O2 System Fault", StatusFault);
export const MapFault = new Fault("map_fault", "MAP Fault", StatusFault);
export const CoolantFault = new Fault("coolant_temperature_fault", "Coolant Sensor Fault", StatusFault);
export const AirTempFault = new Fault("inlet_air_temp_sensor_fault", "Temperature Sensor Fault", StatusFault);
export const FuelPumpFault = new Fault("fuel_pump_circuit_fault", "Fuel Pump Fault", StatusFault);
export const ThrottleFault = new Fault("throttle_pot_circuit_fault", "Throttle Pot. Fault", StatusFault);
export const IdleFault = new Fault("idle_fault", "Idle Fault", StatusFault);
export const IdleGHotFault = new Fault("idle_hot_fault", "Hot Idle Fault", StatusFault);
export const IdleSpeedFault = new Fault("idle_speed_fault", "Idle Speed Fault", StatusFault);
export const IACFault = new Fault("iac_fault", "IACV Fault", StatusFault);
export const VacuumFault = new Fault("vacuum_fault", "Vacuum Pipe Leak", StatusFault);
export const BatteryFault = new Fault("battery_fault", "Battery Low", StatusFault);
export const ThermostatFault = new Fault("thermostat_fault", "Faulty Thermostat", StatusFault);
export const JackFault = new Fault("iac_jack_fault", "Stepper Motor Fault", StatusFault);
export const CrankshaftFault = new Fault("crankshaft_position_sensor_fault", "Crankshaft Sensor Fault", StatusFault);
export const CoilFault = new Fault("coil_fault", "Coil Fault", StatusFault);
export const AtOperatingTemp = new Fault("at_operating_temp", "Operating Temp. Reached", StatusInfo);
export const ClosedLoop = new Fault("closed_loop", "Closed Loop Active", StatusInfo);
