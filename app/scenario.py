from datetime import datetime
import json

class MemsDataStruct(object):
    mems_time: datetime
    mems_80x01_02_engine_rpm: int
    mems_80x03_coolant_temp: int
    mems_80x04_ambient_temp: int
    mems_80x05_intake_air_temp: int
    mems_80x06_fuel_temp: int
    mems_80x07_map_kpa: int
    mems_80x08_battery_voltage: float
    mems_80x09_throttle_pot: float
    mems_80x0a_idle_switch: bool
    mems_80x0b_uk1: int
    mems_80x0c_park_neutral_switch: bool
    mems_80x0d_dtc0: int
    mems_80x0e_dtc1: int
    mems_80x0f_idle_set_point: int
    mems_80x10_idle_hot: int
    mems_80x11_uk2: int
    mems_80x12_iac_position: int
    mems_80x13_14_idle_error: int
    mems_80x15_ignition_advance_offset: int
    mems_80x16_ignition_advance: float
    mems_80x17_18_coil_time: float
    mems_80x19_crankshaft_position_sensor: int
    mems_80x1a_uk4: int
    mems_80x1b_uk5: int
    mems_7dx01_ignition_switch: bool
    mems_7dx02_throttle_angle: int
    mems_7dx03_uk6: int
    mems_7dx04_air_fuel_ratio: float
    mems_7dx05_dtc2: int
    mems_7dx06_lambda_voltage: int
    mems_7dx07_lambda_sensor_frequency: int
    mems_7dx08_lambda_sensor_dutycycle: int
    mems_7dx09_lambda_sensor_status: int
    mems_7dx0a_closed_loop: bool
    mems_7dx0b_long_term_fuel_trim: int
    mems_7dx0c_short_term_fuel_trim: int
    mems_7dx0d_carbon_canister_dutycycle: int
    mems_7dx0e_dtc3: int
    mems_7dx0f_idle_base_pos: int
    mems_7dx10_uk7: int
    mems_7dx11_dtc4: int
    mems_7dx12_ignition_advance2: int
    mems_7dx13_idle_speed_offset: int
    mems_7dx14_idle_error2: int
    mems_7dx15_uk10: int
    mems_7dx16_dtc5: int
    mems_7dx17_uk11: int
    mems_7dx18_uk12: int
    mems_7dx19_uk13: int
    mems_7dx1a_uk14: int
    mems_7dx1b_uk15: int
    mems_7dx1c_uk16: int
    mems_7dx1d_uk17: int
    mems_7dx1e_uk18: int
    mems_7dx1f_jackcount: int
    engine_running: bool
    warming: bool
    at_operating_temp: bool
    engine_idle: bool
    idle_fault: bool
    idle_speed_fault: bool
    idle_hot_fault: bool
    closed_loop: bool
    throttle_active: bool
    map_fault: bool
    vacuum_fault: bool
    iac_fault: bool
    iac_jack_fault: bool
    o2_system_fault: bool
    lambda_range_fault: bool
    lambda_oscillation_fault: bool
    thermostat_fault: bool
    coil_fault: bool
    battery_fault: bool
    crankshaft_position_sensor_fault: bool
    coolant_temperature_fault: bool
    inlet_air_temp_sensor_fault: bool
    fuel_pump_circuit_fault: bool
    throttle_pot_circuit_fault: bool


    def __init__(self, df7d, df80):
        # first 4 characters represent the command code byte and the data packet size
        self._start = 4

        self.mems_80x01_02_engine_rpm = self.get_int_value(df80, 2)
        self.mems_80x03_coolant_temp = self.get_int_value(df80, 1)
        self.mems_80x04_ambient_temp = self.get_int_value(df80, 1)
        self.mems_80x05_intake_air_temp = self.get_int_value(df80, 1)
        self.mems_80x06_fuel_temp = self.get_int_value(df80, 1)
        self.mems_80x07_map_kpa = self.get_int_value(df80, 1)
        self.mems_80x08_battery_voltage = float(self.get_int_value(df80, 1))
        self.mems_80x09_throttle_pot = float(self.get_int_value(df80, 1))
        self.mems_80x0a_idle_switch = bool(self.get_int_value(df80, 1) & 0b00001000 >> 3)
        self.mems_80x0b_uk1 = self.get_int_value(df80, 1)
        self.mems_80x0c_park_neutral_switch = bool(self.get_int_value(df80, 1))
        self.mems_80x0d_dtc0 = self.get_int_value(df80, 1)
        self.mems_80x0e_dtc1 = self.get_int_value(df80, 1)
        self.mems_80x0f_idle_set_point = self.get_int_value(df80, 1)
        self.mems_80x10_idle_hot = self.get_int_value(df80, 1)
        self.mems_80x11_uk2 = self.get_int_value(df80, 1)
        self.mems_80x12_iac_position = self.get_int_value(df80, 1)
        self.mems_80x13_14_idle_error = self.get_int_value(df80, 2)
        self.mems_80x15_ignition_advance_offset = self.get_int_value(df80, 1)
        self.mems_80x16_ignition_advance = float(self.get_int_value(df80, 1))
        self.mems_80x17_18_coil_time = float(self.get_int_value(df80, 2))
        self.mems_80x19_crankshaft_position_sensor = self.get_int_value(df80, 1)
        self.mems_80x1a_uk4 = self.get_int_value(df80, 1)
        self.mems_80x1b_uk5 = self.get_int_value(df80, 1)

        # first 4 characters represent the command code byte and the data packet size
        self._start = 4

        self.mems_7dx01_ignition_switch = bool(self.get_int_value(df7d, 1))
        self.mems_7dx02_throttle_angle = self.get_int_value(df7d, 1)
        self.mems_7dx03_uk6 = self.get_int_value(df7d, 1)
        self.mems_7dx04_air_fuel_ratio = float(self.get_int_value(df7d, 1))
        self.mems_7dx05_dtc2 = self.get_int_value(df7d, 1)
        self.mems_7dx06_lambda_voltage = self.get_int_value(df7d, 1)
        self.mems_7dx07_lambda_sensor_frequency = self.get_int_value(df7d, 1)
        self.mems_7dx08_lambda_sensor_dutycycle = self.get_int_value(df7d, 1)
        self.mems_7dx09_lambda_sensor_status = self.get_int_value(df7d, 1)
        self.mems_7dx0a_closed_loop = bool(self.get_int_value(df7d, 1))
        self.mems_7dx0b_long_term_fuel_trim = self.get_int_value(df7d, 1)
        self.mems_7dx0c_short_term_fuel_trim = self.get_int_value(df7d, 1)
        self.mems_7dx0d_carbon_canister_dutycycle = self.get_int_value(df7d, 1)
        self.mems_7dx0e_dtc3 = self.get_int_value(df7d, 1)
        self.mems_7dx0f_idle_base_pos = self.get_int_value(df7d, 1)
        self.mems_7dx10_uk7 = self.get_int_value(df7d, 1)
        self.mems_7dx11_dtc4 = self.get_int_value(df7d, 1)
        self.mems_7dx12_ignition_advance2 = self.get_int_value(df7d, 1)
        self.mems_7dx13_idle_speed_offset = self.get_int_value(df7d, 1)
        self.mems_7dx14_idle_error2 = self.get_int_value(df7d, 1)
        self.mems_7dx15_uk10 = self.get_int_value(df7d, 1)
        self.mems_7dx16_dtc5 = self.get_int_value(df7d, 1)
        self.mems_7dx17_uk11 = self.get_int_value(df7d, 1)
        self.mems_7dx18_uk12 = self.get_int_value(df7d, 1)
        self.mems_7dx19_uk13 = self.get_int_value(df7d, 1)
        self.mems_7dx1a_uk14 = self.get_int_value(df7d, 1)
        self.mems_7dx1b_uk15 = self.get_int_value(df7d, 1)
        self.mems_7dx1c_uk16 = self.get_int_value(df7d, 1)
        self.mems_7dx1d_uk17 = self.get_int_value(df7d, 1)
        self.mems_7dx1e_uk18 = self.get_int_value(df7d, 1)
        self.mems_7dx1f_jackcount = self.get_int_value(df7d, 1)

        self.intialise_analytics()

        # apply the calculations to convert the raw data into measurements
        self.apply_calculations()

    def get_int_value(self, dataframe, bytes):
        # 1 byte = 2 characters, move the end to read the number of characters needed for the size of the data in bytes
        length = bytes * 2
        end = self._start + length

        # convert the hex characters into an integer
        # float / bool or calculations will not be applied here
        i = int(dataframe[self._start:end], 16)

        # move the start to the next position in the string
        self._start = end

        return i

    def intialise_analytics(self):
        self.engine_running = False
        self.warming = False
        self.at_operating_temp = False
        self.engine_idle = False
        self.idle_fault = False
        self.battery_fault = False
        self.idle_speed_fault = False
        self.idle_hot_fault = False
        self.closed_loop = False
        self.throttle_active = False
        self.map_fault = False
        self.vacuum_fault = False
        self.iac_fault = False
        self.iac_jack_fault = False
        self.o2_system_fault = False
        self.lambda_range_fault = False
        self.lambda_oscillation_fault = False
        self.thermostat_fault = False
        self.coil_fault = False
        self.crankshaft_position_sensor_fault = False

    def apply_calculations(self):
        self.mems_80x03_coolant_temp -= 55
        self.mems_80x04_ambient_temp -= 55
        self.mems_80x05_intake_air_temp -= 55
        self.mems_80x06_fuel_temp -= 55
        self.mems_80x08_battery_voltage /= 10
        self.mems_80x16_ignition_advance = (self.mems_80x16_ignition_advance / 2) - 24
        self.mems_80x17_18_coil_time *= 0.002
        self.mems_80x0f_idle_set_point *= 6.1

        self.mems_7dx02_throttle_angle = int(self.mems_7dx02_throttle_angle * 6 / 10)
        self.mems_7dx04_air_fuel_ratio /= 10
        self.mems_7dx06_lambda_voltage *= 5
        self.mems_7dx0b_long_term_fuel_trim -= 128
        self.mems_7dx0c_short_term_fuel_trim -= 100
        self.mems_7dx12_ignition_advance2 -= 48

        self.coolant_temperature_fault = bool(self.mems_80x0d_dtc0 >> 0 & 1)
        self.inlet_air_temp_sensor_fault = bool(self.mems_80x0d_dtc0 >> 1 & 1)
        self.fuel_pump_circuit_fault = bool(self.mems_80x0e_dtc1 >> 1 & 1)
        self.throttle_pot_circuit_fault = bool(self.mems_80x0e_dtc1 >> 7 & 1)

        if self.mems_80x01_02_engine_rpm > 0:
            self.engine_running = True

        if self.engine_running:
            self.battery_fault = self.mems_80x08_battery_voltage < 13

        # allow for coolant temperature to reduce as the thermostat opens
        if self.mems_80x03_coolant_temp >= 78:
            self.at_operating_temp = True
        else:
            self.warming = True

        self.closed_loop = self.mems_7dx0a_closed_loop

        # throttle is active if the throttle is > 14 degrees
        # if engine rpm is > 1300 and it looks like an idle, then we're cruising
        # otherwise we're idling
        if self.mems_7dx02_throttle_angle > 14 or self.mems_80x01_02_engine_rpm > 1300:
            self.throttle_active = True
        else:
            self.engine_idle = True

        # if the engine is at idle then a MAP reading of > 45kPA indicates a vacuum fault
        if self.engine_idle:
            self.map_fault = self.mems_80x07_map_kpa > 45
        else:
            self.map_fault = False

        # if the battery is good
        # coil fault if recharge time > 4ms
        if not self.battery_fault:
            if self.mems_80x17_18_coil_time > 4:
                self.coil_fault = True

        # if the lambda status changes to 0 then there is an O2 system fault
        self.o2_system_fault = self.mems_7dx09_lambda_sensor_status == 0

        # This is the number of steps from 0 which the ECU will use as guide for starting idle speed control during engine warm up.
        # The value will start at quite a high value (>100 steps) on a very cold engine and fall to < 50 steps on a fully warm engine.
        # A high value on a fully warm engine or a low value on a cold engine will cause poor idle speed control.
        # Idle run line position is calculated by the ECU using the engine coolant temperature sensor.
        if self.engine_idle:
            if self.at_operating_temp:
                # fault if > 50 when engine is warm
                self.idle_fault = self.mems_7dx0f_idle_base_pos > 55
            else:
                # fault if < 50 when engine is cold
                self.idle_fault = self.mems_7dx0f_idle_base_pos < 45

        if self.engine_idle:
            if self.at_operating_temp:
                # fault if idle hot is outside the range of 10 - 50
                self.idle_hot_fault = self.mems_80x10_idle_hot < 10 or self.mems_80x10_idle_hot > 55

        # Also known as stepper motor idle air control valve (IACV)
        # This bolts on the side of the injection body housing to control engine idle speed and air flow from cold start up
        # A high number of steps indicates that the ECU is attempting to close the stepper or reduce the airflow
        # a low number would indicate the inability to increase airflow
        # IAC position invalid if the idle offset exceeds the max error, yet the IAC Position remains at 0
        if self.engine_idle:
            self.iac_fault = bool(self.mems_80x13_14_idle_error > 50 and self.mems_80x12_iac_position == 0)

        if self.engine_idle:
            self.vacuum_fault = self.mems_80x07_map_kpa > 45

        if self.engine_idle:
            self.lambda_range_fault = self.mems_7dx06_lambda_voltage < 10 or self.mems_7dx06_lambda_voltage > 900

        # the count indicates the number of times the ECU has had to re-learn
        # the relationship between the stepper position and the throttle position.
        # If this count is high or increments each time the ignition is turned off,
        # then there may be a problem with the stepper motor, throttle cable adjustment or the throttle pot.
        # The count is increased for each journey with no closed throttle, indicating a throttle adjustment problem.
        self.iac_jack_fault = self.mems_7dx1f_jackcount > 50

        if self.engine_running:
            self.crankshaft_position_sensor_fault = self.mems_80x19_crankshaft_position_sensor == 0


class ScenarioResponse:
    Time: datetime
    Dataframe7d: str
    Dataframe80: str

    def __init__(self, Time: datetime, Dataframe7d: str, Dataframe80: str) -> None:
        self.Time = Time
        self.Dataframe7d = Dataframe7d
        self.Dataframe80 = Dataframe80

    def __str__(self):
        return f"Time: {self.Time} 0x7D: {self.Dataframe7d} 0x80: {self.Dataframe80}"

class Scenario:
    Name: str
    Count: int
    Date: datetime
    Summary: str
    ECUID: str
    ECUSerial: str
    MemsData: []
    MemsDataValues: []

    def __init__(self, Name: str, Count: int, Date: datetime, Summary: str, ECUID: str, ECUSerial: str, MemsData: []) -> None:
        self.Name = Name
        self.Count = Count
        self.Date = Date
        self.Summary = Summary
        self.ECUID = ECUID
        self.ECUSerial = ECUSerial
        self.MemsData = MemsData
        self.MemsDataValues = self.generate_dataframes()

    def generate_dataframes(self):
        m = []

        for df in self.MemsData:
            try:
                data = MemsDataStruct(df['Dataframe7d'], df['Dataframe80'])
                data.mems_time = df['Time']
                m.append(data)
            except Exception as err:
                print(f"Unexpected {err=}, {type(err)=}")

        return m

    def is_valid_source_data(self, data):
        return (len(data['Dataframe7d']) >= 66) and (len(data['Dataframe80']) >= 58)


class ScenarioEncoder(json.JSONEncoder):
    def default(self, o):
        return o.__dict__
