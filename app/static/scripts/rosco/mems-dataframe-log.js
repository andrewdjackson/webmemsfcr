import {Dataframe, Dataframe7d, Dataframe80, getDateTimeString} from "./mems-dataframe.js";
import * as Constant from "../analysis/analysis-constants.js";

const CSV_HEADER = [`#time`,`80x01-02_engine-rpm`,`80x03_coolant_temp`,`80x04_ambient_temp`,`80x05_intake_air_temp`,`80x06_fuel_temp`,`80x07_map_kpa`,`80x08_battery_voltage`,`80x09_throttle_pot`,`80x0A_idle_switch`,`80x0B_aircon`,`80x0C_park_neutral_switch`,`80x0F_idle_set_point`,`80x10_idle_hot`,`80x12_iac_position`,`80x13-14_idle_error`,`80x15_ignition_advance_offset`,`80x16_ignition_advance`,`80x17-18_coil_time`,`80x19_crankshaft_position_sensor`,`coolant_sensor_fault`,`air_intake_sensor_fault`,`fuel_pump_circuit_fault`,`throttle_pot_fault`,`0x80_raw`,`7dx01_ignition_switch`,`7dx02_throttle_angle`,`7dx04_air_fuel_ratio`,`7dx06_lambda_voltage`,`7dx07_lambda_sensor_frequency`,`7dx08_lambda_sensor_dutycycle`,`7dx09_lambda_sensor_status`,`7dx0A_closed_loop`,`7dx0B_long_term_fuel_trim`,`7dx0C_short_term_fuel_trim`,`7dx0D_carbon_canister_dutycycle`,`7dx0F_idle_base_pos`,`7dx12_ignition_advance2`,`7dx13_idle_speed_offset`,`7dx1F_jack_count`,`0x7d_raw`];
const MIN_DATAFRAMES = 2;

export class DataframeLog {
    constructor() {
        this.initialise();
    }

    initialise() {
        this._dataframe80 = [];
        this._dataframe7d = [];
        this._dataframes = [];
    }

    get dataframes() {
        return this._dataframes;
    }

    //
    // need at least 2 dataframes
    //
    get hasLoggedData() {
        return this._dataframes.length >= MIN_DATAFRAMES;
    }

    //
    // MEMS 1.3 only support 0x80 dataframe requests
    // as such with a MEMS 1.3, only the array for 0x80 dataframes will contain data
    //
    get isMemsVersion13() {
        return ((this._dataframe80.length > 1) && (this._dataframe7d.length === 0));
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
                this._dataframe80.push(dataframe);
            }

            if (dataframe instanceof Dataframe7d) {
                this._dataframe7d.push(dataframe);
            }

            this._createDataframe();
        }
    }

    downloadCSVFile(ecuId) {
        let csv = this._convertToCSV(this._dataframes);
        this._exportCSV(csv, ecuId);

        console.info('exported csv file');
    }

    _createDataframe() {
        let dataframe;

        if (this.isMemsVersion13) {
            dataframe = new Dataframe(this._dataframe80.at(-1));
            console.debug(`MEMS 1.3 dataframe added to the log ${JSON.stringify(dataframe)}`);
        } else {
            if (this._dataframe80.length === this._dataframe7d.length) {
                dataframe = new Dataframe(this._dataframe80.at(-1), this._dataframe7d.at(-1));
                console.debug(`MEMS 1.6+ dataframe added to the log ${JSON.stringify(dataframe)}`);
            }
        }
        if (dataframe !== undefined) {
            this._addDataframe(dataframe);
            // remove the individual dataframes as these are no longer needed
            this._dataframe80.pop();
            this._dataframe7d.pop();
            return true;
        }

        return false;
    }

    //
    // remove the entries not required and add to the dataframes array
    // if the dataframe contains valid data
    //
    _addDataframe(dataframe) {
        if (this._isDataframeValid(dataframe)) {
            delete dataframe._7Dx00_Time;
            this._dataframes.push(dataframe);
        }
    }


    _convertToCSV(items) {
        const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
        const header = Object.keys(items[0]);
        let csv = [
            CSV_HEADER.join(','), // header row first
            ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');

        // remove quotes from dates and raw data strings
        csv = csv.replaceAll('"','');

        return csv;
    }

    //
    // create a hidden link in the document, attach the url for the file data
    // and call the click() function to download the file
    //
    _exportCSV(csv, ecuId) {
        let link = document.createElement("a");

        if (link.download !== undefined) {
            // create a 'file' for download from the csv data
            let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            let url = URL.createObjectURL(blob);

            // generate a filename
            let filename = this._getFilename(ecuId);

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

    _getFilename(ecuId) {
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

    //
    // only use data that contains valid entries for analysis
    //
    _isDataframeValid(df) {
        let isValid = this._isEngineRPMValid(df) &&
            this._isCoolantTempValid(df) &&
            this._isIntakeAirTempValid(df) &&
            this._isMAPValid(df);

        if (!isValid) {
            console.error(`invalid dataframe ${JSON.stringify(df)}`);
        }

        return isValid;
    }

    _isEngineRPMValid(data)  {
        return (data._80x01_EngineRPM < Constant.maximumEngineRPM);
    }

    _isCoolantTempValid(data) {
        return (data._80x03_CoolantTemp < Constant.maximumCoolantTemperature);
    }

    _isIntakeAirTempValid(data) {
        return (data._80x05_IntakeAirTemp < Constant.maximumAirIntakeTemperature);
    }

    _isMAPValid(data) {
        return (data._80x07_ManifoldAbsolutePressure > 0);
    }
}
