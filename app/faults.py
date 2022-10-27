class Faults(object):
    faults = []

    def __init__(self):
        self.faults = []

    def set_dataframes(self, df):
        self.df = df

    def find_fault(self, metric):
        fault_list = self.df.index[self.df[metric] == True].to_list()
        return fault_list


    def find_first_fault(self, metric):
        fault_index = None
        fault_start_time = None
        fault_list = self.find_fault(metric)

        if len(fault_list) > 0:
            fault_index = fault_list[0]
            fault_start_time = self.df.loc[fault_index]['date']

        return fault_index, fault_start_time


    def add_first_fault(self, metric, text, fault_type="alert"):
        index, start = self.find_first_fault(metric)
        fault = {"index":index, "metric":metric, "time":start, "text":text, "type":fault_type}
        self.faults.append(fault)


    def add_all_faults(self, metric, text, fault_type="alert"):
        fault_list = self.find_fault(metric)
        last_fault = len(fault_list) - 1
        if last_fault > 10:
            interval = int(last_fault / 10)
            short_fault_list = []

            for i in range(0, last_fault, interval):
                short_fault_list.append(fault_list[i])

            fault_list = short_fault_list

        for index in fault_list:
            start = self.df.loc[index]['date']
            fault = {"index":index, "metric":metric, "time":start, "text":text, "type":fault_type}
            self.faults.append(fault)

    def get_active_faults(self):
        seen = set()
        active = []
        for d in self.faults:
            t = tuple(d.items())
            index = t[0][1]
            metric = t[1][1]
            if metric not in seen:
                seen.add(metric)
                if index is not None:
                    active.append(d)

        return active

    def create_annotations(self, metric, filter=None):
        annotations = []
        add_fault = True

        for fault in self.faults:
            index = fault["index"]

            if index is not None:
                if filter is not None:
                    if fault["metric"] in filter:
                        add_fault = True
                    else:
                        add_fault = False

                if add_fault:
                    value = self.df[metric].loc[index]
                    text = f"{fault['text']}"
                    annotations.append({"x" : fault["time"], "y" : value, "text" : text})

        return annotations
