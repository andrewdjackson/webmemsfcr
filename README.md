# WebMemsFCR
WebMesFCR is an online web version of the popular MemsFCR. 

## What is MemsFCR ?
MemsFCR is a Fault Code Reader and Fault Diagnostic Tool for the Rover MEMS 1.3/1.6 fitted to Rover Single Point Injection Minis.

## What does it do ?
MemsFCR connects to your Rover MEMS ECU via a special diagnostic cable that can purchased on eBay. All known ECU data parameters are displayed along with any faults that have been detected. All data can be downloaded as a CSV file for easy analysis using Excel or Google Sheets.

## How do I use it ?

Once you have bought a SPI Diagnostic Cable, if you are using Windows, you will need to install the relevant drivers. These can be found on the [FTDI website](https://www.ftdichip.com/Drivers/VCP.htm).
Connect the cable to the diagnostic port under the bonnet and turn the car ignition on (it doesn't need to be running). Then connect the cable to your computer and open the [WebMemsFCR](https://web.memsfcr.co.uk) application. 

Click the Connect button and select the COM port that the cable is connected to.
You should see the application connect to the ECU and start displaying data. If you have any faults, these will be displayed in the Faults tab. You can download all the data as a CSV file by clicking the Download button.

