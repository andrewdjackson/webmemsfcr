import pandas as pd
import datetime

from faults import Faults
from scenario import Scenario, ScenarioEncoder

class Analysis(object):
    analysed: bool
    df: pd.DataFrame
    faults: Faults
    scenario: Scenario

    def __init__(self, dataframes):
        self.faults = Faults()

        if len(dataframes) > 0:
            self.scenario = Scenario(Name="", Count=len(dataframes), Date=datetime.datetime.now(), ECUSerial="", ECUID="", Summary="", MemsData=dataframes)
            memsdata = ScenarioEncoder().encode(self.scenario.MemsDataValues)
            self.df = pd.read_json(memsdata)
            self.clean_data()
            self.analyse()
        else:
            print('no dataframes to analyse')

    #
    # analyse the log file
    #
    def analyse(self):
        if not self.df.empty:
            self.analyse_for_faults()
            self.analysed = True
        else:
            print('no dataframes to analyse')

        return self.faults

    def analyse_for_faults(self):
        # determine whether the engine was off when the recording started
        engine_off_at_start = self.df["80x01_02_engine_rpm"].iloc[0] == 0

        # and create a dataframe with the data when the engine was running
        engine_running_df = self.df.loc[self.df['80x01_02_engine_rpm'] > 0]

        if len(engine_running_df) > 0:
            # create a subset with engine at idle
            engine_idle_df = self.df.loc[self.df['engine_idle'] == True]

            # get when the engine was started
            engine_start_time = engine_running_df.iloc[0]['date']

            if len(engine_running_df) > 3:
                # trim the first 3 seconds of the engine run to remove noise
                if engine_off_at_start:
                    offset = datetime.timedelta(seconds = 2)
                    engine_running_df = engine_running_df.loc[engine_running_df['date'] >= engine_start_time + offset]

                # trim the engine switch off to remove noise
                engine_running_df = engine_running_df.iloc[:-2]

            #
            # evaluate faults that require a data series
            #

            # check if the lambda voltage is oscillating (std dev > 100)
            if engine_running_df['7dx06_lambda_voltage'].std() < 100:
                engine_running_df.loc[:,'lambda_oscillation_fault'] = True

            # check if the engine has reached operating temperature as expected
            start_temperature = engine_running_df["80x03_coolant_temp"].iloc[0]
            degrees_until_warm = 80 - start_temperature
            seconds_to_warm = datetime.timedelta(seconds = int(degrees_until_warm * 12))
            warm_engine = engine_running_df.loc[engine_running_df['date'] >= engine_start_time + seconds_to_warm]

            if len(warm_engine) > 0:
                engine_temp = warm_engine["80x03_coolant_temp"].iloc[0]

                if engine_temp < 80:
                    engine_running_df.loc[:,"thermostat_fault"] = True

            # a mean value of more than 100 RPM indicates that the ECU is not in control of the idle speed. This indicates a possible fault condition.
            if engine_idle_df["7dx0f_idle_base_pos"].mean() > 150:
                engine_running_df.loc[:,"idle_speed_fault"] = True

            #
            # find the faults in the data series that have been calculated when the data is loaded
            #
            self.faults = Faults()
            self.faults.set_dataframes(df=engine_running_df)
            self.faults.add_first_fault("o2_system_fault", "O2 System Fault")
            self.faults.add_first_fault("map_fault", "MAP Fault")
            self.faults.add_first_fault("coolant_temperature_fault", "Coolant Sensor Fault")
            self.faults.add_first_fault("inlet_air_temp_sensor_fault", "Temperature Sensor Fault")
            self.faults.add_first_fault("fuel_pump_circuit_fault", "Fuel Pump Fault")
            self.faults.add_first_fault("throttle_pot_circuit_fault", "Throttle Pot. Fault")
            self.faults.add_first_fault("idle_fault", "Idle Fault")
            self.faults.add_first_fault("idle_hot_fault", "Hot Idle Fault")
            self.faults.add_first_fault("idle_speed_fault", "Idle Speed Fault")
            self.faults.add_first_fault("iac_fault", "IACV Fault")
            self.faults.add_first_fault("vacuum_fault", "Vacuum Pipe Leak")
            self.faults.add_first_fault("battery_fault", "Battery Low")
            self.faults.add_first_fault("thermostat_fault", "Faulty Thermostat")
            self.faults.add_first_fault("iac_jack_fault", "Stepper Motor Fault")
            self.faults.add_all_faults("crankshaft_position_sensor_fault", "Crankshaft Sensor Fault")
            self.faults.add_all_faults("coil_fault", "Coil Fault")

            #
            # add useful indicators to the fault list
            #
            self.faults.add_first_fault("at_operating_temp", "Operating Temp. Reached", fault_type="info")
            self.faults.add_first_fault("closed_loop", "Closed Loop Active", fault_type="info")

            # apply changes to the original dataframe
            if not engine_running_df.empty:
                self.df = engine_running_df

    #
    # clean the data
    #
    def clean_data(self):
        # tidy the data,
        # remove the _start column
        self.df.drop(['_start'], axis=1, inplace=True)
        # rename mems_time to date
        self.df.rename({'mems_time': 'date'}, axis=1, inplace=True)
        # rename time column to date
        self.df.rename({'#time': 'date'}, axis=1, inplace=True)
        # remove the mems_ prefixes
        self.df.columns = self.df.columns.str.replace("mems_","")

        # remove entries with erroneous data
        self.df.drop(self.df[ self.df["80x01_02_engine_rpm"] > 6000 ].index, inplace=True)
        self.df.drop(self.df[ self.df["80x03_coolant_temp"] > 120 ].index, inplace=True)
        self.df.drop(self.df[ self.df["7dx0f_idle_base_pos"] > 250 ].index, inplace=True)
        self.df.drop(self.df[ self.df["80x05_intake_air_temp"] > 80 ].index, inplace=True)

        # when dtc5 changes from 255 a number of parameters change that can alter the analysis (e.g jack count = 125)
        # since this behaviour is not yet understood, we'll remove these entries
        #self.df.drop(self.df[ self.df["7dx16_dtc5"] < 255 ].index, inplace=True)
