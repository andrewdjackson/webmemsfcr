const csvHeader = [`#time`,`80x01-02_engine-rpm`,`80x03_coolant_temp`,`80x04_ambient_temp`,`80x05_intake_air_temp`,`80x06_fuel_temp`,`80x07_map_kpa`,`80x08_battery_voltage`,`80x09_throttle_pot`,`80x0A_idle_switch`,`80x0B_aircon`,`80x0C_park_neutral_switch`,`80x0F_idle_set_point`,`80x10_idle_hot`,`80x12_iac_position`,`80x13-14_idle_error`,`80x15_ignition_advance_offset`,`80x16_ignition_advance`,`80x17-18_coil_time`,`80x19_crankshaft_position_sensor`,`coolant_sensor_fault`,`air_intake_sensor_fault`,`fuel_pump_circuit_fault`,`throttle_pot_fault`,`0x80_raw`,`7dx01_ignition_switch`,`7dx02_throttle_angle`,`7dx04_air_fuel_ratio`,`7dx06_lambda_voltage`,`7dx07_lambda_sensor_frequency`,`7dx08_lambda_sensor_dutycycle`,`7dx09_lambda_sensor_status`,`7dx0A_closed_loop`,`7dx0B_long_term_fuel_trim`,`7dx0C_short_term_fuel_trim`,`7dx0D_carbon_canister_dutycycle`,`7dx0F_idle_base_pos`,`7dx12_ignition_advance2`,`7dx13_idle_speed_offset`,`7dx1F_jack_count`,`0x7d_raw`];

export class DataframeLog {
    constructor() {
        this.initialise();
    }

    initialise() {
        this.dataframe80 = [];
        this.dataframe7d = [];
    }

    get hasLoggedData() {
        return this.dataframe80.length > 0;
    }

    //
    // add the dataframe to the log
    // there are arrays for 0x80 and 0x7d dataframes
    // this is due to early ecu's only supporting 0x80 dataframes and the commands as issued
    // independent of each other.
    //
    addDataframe(dataframe) {
        if (dataframe !== undefined) {
            if (dataframe instanceof Dataframe80) {
                dataframe['id'] = this.dataframe80.length;
                this.dataframe80.push(dataframe);
            }

            if (dataframe instanceof Dataframe7d) {
                dataframe['id'] = this.dataframe7d.length;
                this.dataframe7d.push(dataframe);
            }
        }
    }

    //
    // the arrays for 0x80 and 0x7d responses are merged together based on id
    // this ensures we pair the commands correctly
    //
    mergeLoggedDataframesByIndex() {
        return [...this.dataframe80.concat(this.dataframe7d)
            .reduce((r, o) => {
                r.has(o.id) || r.set(o.id, {});

                const item = r.get(o.id);

                Object.entries(o).forEach(([k, v]) =>
                    item[k] = Array.isArray(item[k]) ?
                        [...new Set([...item[k], ...v])] : v
                );

                return r;
            }, new Map()).values()];
    }

    downloadCSVFile(ecuId) {
        let df = this.mergeLoggedDataframesByIndex();
        let mergedDataframes = this.cleanLog(df);
        let csv = this.convertToCSV(mergedDataframes);
        this.exportCSV(csv, ecuId);

        console.info('exported csv file');
    }

    convertToCSV(items) {
        const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
        const header = Object.keys(items[0]);
        let csv = [
            csvHeader.join(','), // header row first
            ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');

        // remove quotes from dates and raw data strings
        csv = csv.replaceAll('"','');

        return csv;
    }

    //
    // remove properties not required in csv
    //
    cleanLog(items) {
        items.forEach(function(v) {
            delete v.id;
            delete v._7Dx00_Time;
        });

        return items;
    }
    //
    // create a hidden link in the document, attach the url for the file data
    // and call the click() function to download the file
    //
    exportCSV(csv, ecuId) {
        let link = document.createElement("a");

        if (link.download !== undefined) {
            // create a 'file' for download from the csv data
            let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            let url = URL.createObjectURL(blob);

            // generate a filename
            let filename = this.getFilename(ecuId);

            // update the link with the relevant attributes
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);

            // click the link to start the download
            link.click();

            // tidy up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    getFilename(ecuId) {
        // generate a filename based on the date and time
        let filename = getDateTimeString();
        // trim milliseconds
        filename = filename.substring(0, filename.length - 4);
        // replace spaces with dashes
        filename = filename.replaceAll(' ', '-');
        // remove colons
        filename = filename.replaceAll(':', '');

        if (ecuId === undefined) {
            filename += "-memsfcr.csv";
        } else {
            filename += `-${ecuId}.csv`;
        }

        return filename;
    }
}

export class Dataframe80 {
    constructor() {
        this._80x00_Time = getDateTimeString();
        this._80x01_EngineRPM = 0;
        this._80x03_CoolantTemp = 0;
        this._80x04_AmbientTemp = 0;
        this._80x05_IntakeAirTemp = 0;
        this._80x06_FuelTemp = 0;
        this._80x07_ManifoldAbsolutePressure = 0;
        this._80x08_BatteryVoltage = 0;
        this._80x09_ThrottlePotSensor = 0.0;
        this._80x0A_IdleSwitch = false;
        this._80x0B_AirconSwitch = false;
        this._80x0C_ParkNeutralSwitch = false;
        this._80x0F_IdleSetPoint = 0;
        this._80x10_IdleHot = 0;
        this._80x12_IACPosition = 0;
        this._80x13_IdleSpeedDeviation = 0;
        this._80x15_IgnitionAdvanceOffset = 0;
        this._80x16_IgnitionAdvance = 0;
        this._80x17_CoilTime = 0;
        this._80x19_CrankshaftPositionSensor = 0;
        this.CoolantTempSensorFault = false;
        this.IntakeAirTempSensorFault = false;
        this.FuelPumpCircuitFault = false;
        this.ThrottlePotCircuitFault = false;
        this._80_RawData = "";
    }

    updateValuesFromEcuResponse(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._80x00_Time = getDateTimeString(ecuResponse.command.id);
        this._80x01_EngineRPM = (data[1] << 8) + data[2];
        this._80x03_CoolantTemp = data[3] - 55;
        this._80x04_AmbientTemp = data[4] - 55;
        this._80x05_IntakeAirTemp = data[5] - 55;
        this._80x06_FuelTemp = data[6] - 55;
        this._80x07_ManifoldAbsolutePressure = data[7];
        this._80x08_BatteryVoltage = data[8] / 10;
        this._80x09_ThrottlePotSensor = data[9] * 0.02;
        this._80x0A_IdleSwitch = (data[0x0a] & 0x00001000) >> 3;
        this._80x0B_AirconSwitch = data[0x0b] > 0;
        this._80x0C_ParkNeutralSwitch = data[0x0c] > 0;
        this._80x0F_IdleSetPoint = data[0x0f] * 6.1;
        this._80x10_IdleHot = data[0x10];
        this._80x12_IACPosition = data[0x12];
        this._80x13_IdleSpeedDeviation = (data[0x13] << 8) + data[14];
        this._80x15_IgnitionAdvanceOffset = data[0x15];
        this._80x16_IgnitionAdvance = (data[0x16] / 2) - 24;
        this._80x17_CoilTime =((data[0x17] << 8) + data[0x18]) * 0.002;
        this._80x19_CrankshaftPositionSensor = data[0x19];
        this.CoolantTempSensorFault = ((data[13] >> 0) & 1 ) > 0;
        this.IntakeAirTempSensorFault = ((data[13] >> 2) & 1 ) > 0;
        this.FuelPumpCircuitFault = ((data[14] >> 1) & 3) > 0;
        this.ThrottlePotCircuitFault = ((data[14] >> 7) & 4) > 0;
        this._80_RawData = arrayAsHexString(ecuResponse.response);
    }
}

export class Dataframe7d {
    constructor() {
        this._7Dx00_Time = getDateTimeString();
        this._7Dx01_IgnitionSwitch = 0;
        this._7Dx02_ThrottleAngle = 0;
        this._7Dx04_AirFuelRatio = 0;
        this._7Dx06_LambdaVoltage = 0;
        this._7Dx07_LambdaFrequency = 0;
        this._7Dx08_LambdaDutycycle = 0;
        this._7Dx09_LambdaStatus = 0;
        this._7Dx0A_ClosedLoop = false;
        this._7Dx0B_LongTermFuelTrim = 0;
        this._7Dx0C_ShortTermFuelTrim = 0;
        this._7Dx0D_CarbonCanisterPurgeValve = 0;
        this._7Dx0F_IdleBasePosition = 0;
        this._7Dx12_IgnitionAdvanceOffset = 0;
        this._7Dx13_IdleSpeedOffset = 0;
        this._7Dx1F_JackCount = 0;
        this._7D_RawData = "";
    }

    updateValuesFromEcuResponse(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._7Dx00_Time = getDateTimeString(ecuResponse.command.id);
        this._7Dx01_IgnitionSwitch = data[1] > 0;
        this._7Dx02_ThrottleAngle = data[2] / 2; // * 0.6?
        this._7Dx04_AirFuelRatio = data[4] / 10;
        this._7Dx06_LambdaVoltage = data[6] * 5;
        this._7Dx07_LambdaFrequency = data[7];
        this._7Dx08_LambdaDutycycle = data[8];
        this._7Dx09_LambdaStatus = data[9];
        this._7Dx0A_ClosedLoop = data[0x0a] > 0;
        this._7Dx0B_LongTermFuelTrim = data[0x0b] - 128;
        this._7Dx0C_ShortTermFuelTrim = data[0x0c] - 100;
        this._7Dx0D_CarbonCanisterPurgeValve = data[0x0d];
        this._7Dx0F_IdleBasePosition = data[0x0f];
        this._7Dx12_IgnitionAdvanceOffset = data[0x12] - 48;
        this._7Dx13_IdleSpeedOffset = data[0x13];
        this._7Dx1F_JackCount = data[0x1f];
        this._7D_RawData = arrayAsHexString(ecuResponse.response);
    }
}

export function getDateTimeString(unixtime) {
    let date = new Date();

    if (unixtime !== undefined) {
        date = new Date(unixtime);
    }

    let today = `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let time  = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
    return `${today} ${time}`;
}

//
// convert bytes into a hex string
//
export function arrayAsHexString(data) {
    let hex = "";

    data.forEach(value => {
        hex += value.toString(16).padStart(2, '0');
    });

    return hex.toUpperCase();
}
