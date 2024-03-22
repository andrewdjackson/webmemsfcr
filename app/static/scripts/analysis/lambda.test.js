import {describe, it, expect} from "@jest/globals";
import {Lambda, LAMBDA_FAULTY, LAMBDA_WORKING, LAMBDA_HEATER_WORKING, LAMBDA_HEATER_FAULTY} from "./lambda.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";
import {createValidDataframe} from "../fixtures/test.fixtures.js";
import {getDateTimeString} from "../rosco/mems-dataframe.js";

describe('lambda', () => {
    it('oscillating as expected', () => {
        const lambdaProfile = [435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 420, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 440, 440, 435, 440, 435, 435, 435, 435, 435, 440, 440, 440, 440, 440, 445, 445, 450, 455, 455, 465, 470, 475, 485, 495, 505, 515, 530, 540, 555, 570, 590, 605, 625, 640, 660, 675, 680, 660, 650, 635, 605, 550, 535, 425, 445, 405, 330, 285, 255, 240, 225, 210, 190, 190, 250, 330, 520, 345, 265, 505, 390, 505, 400, 215, 235, 410, 435, 270, 540, 335, 270, 370, 535, 560, 295, 530, 400, 355, 320, 335, 300, 295, 285, 555, 345, 385, 390, 390, 320, 170, 365, 320, 370, 535, 500, 340, 455, 555, 240, 290, 435, 305, 475, 165, 570, 270, 600, 165, 180, 775, 775, 905, 880, 160, 405, 130, 135, 220, 180, 170, 150, 215, 210, 275, 470, 580, 180, 550, 265, 325, 525, 600, 770, 585, 345, 180, 815, 690, 155, 570, 200, 880, 910, 620, 305, 220, 790, 475, 405, 255, 465, 460, 115, 790, 640, 275, 400, 280, 365, 745, 540, 405, 550, 300, 330, 160, 325, 160, 255, 415, 225, 265, 695, 250, 665, 500, 695, 555, 165, 430, 660, 615, 595, 660, 235, 735, 365, 205, 685, 325, 200, 230, 785, 400, 175, 300, 185, 220, 300, 575, 225, 530, 150, 685, 320, 650, 135, 290, 445, 175, 370, 295, 530, 320, 280, 405, 470, 610, 265, 265, 370, 730, 515, 470, 575, 375, 390, 520, 705, 470, 245, 625, 675, 375, 590, 675, 390, 230, 125, 165, 605, 220, 535, 385, 295, 740, 645, 570, 460, 165, 585, 550, 555, 265, 420, 135, 740, 90, 260, 690, 290, 295, 405, 675, 585, 315, 570, 290, 740, 205];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isOscillating()).toBe(LAMBDA_WORKING);
        expect(lambda.isHeaterFaulty()).toBe(LAMBDA_HEATER_WORKING);
    })

    it('no oscillations', () => {
        const lambdaProfile = [435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isOscillating()).toBe(LAMBDA_FAULTY);
        expect(lambda.isHeaterFaulty()).toBe(LAMBDA_HEATER_FAULTY);
    })

    it('not enough time to diagnose', () => {
        const lambdaProfile = [435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isOscillating()).toBe(LAMBDA_WORKING);
        expect(lambda.isHeaterFaulty()).toBe(LAMBDA_HEATER_WORKING);
    })

    it('heater issue, late oscillations', () => {
        const lambdaProfile = [435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 420, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 435, 440, 440, 435, 440, 435, 435, 435, 435, 435, 440, 440, 440, 440, 440, 445, 445, 450, 455, 455, 465, 470, 475, 485, 495, 505, 515, 530, 540, 555, 570, 590, 605, 625, 640, 660, 675, 680, 660, 650, 635, 605, 550, 535, 425, 445, 405, 330, 285, 255, 240, 225, 210, 190, 190, 250, 330, 520, 345, 265, 505, 390, 505, 400, 215, 235, 410, 435, 270, 540, 335, 270, 370, 535, 560, 295, 530, 400, 355, 320, 335, 300, 295, 285, 555, 345, 385, 390, 390, 320, 170, 365, 320, 370, 535, 500, 340, 455, 555, 240, 290, 435, 305, 475, 165, 570, 270, 600, 165, 180, 775, 775, 905, 880, 160, 405, 130, 135, 220, 180, 170, 150, 215, 210, 275, 470, 580, 180, 550, 265, 325, 525, 600, 770, 585, 345, 180, 815, 690, 155, 570, 200, 880, 910, 620, 305, 220, 790, 475, 405, 255, 465, 460, 115, 790, 640, 275, 400, 280, 365, 745, 540, 405, 550, 300, 330, 160, 325, 160, 255, 415, 225, 265, 695, 250, 665, 500, 695, 555, 165, 430, 660, 615, 595, 660, 235, 735, 365, 205, 685, 325, 200, 230, 785, 400, 175, 300, 185, 220, 300, 575, 225, 530, 150, 685, 320, 650, 135, 290, 445, 175, 370, 295, 530, 320, 280, 405, 470, 610, 265, 265, 370, 730, 515, 470, 575, 375, 390, 520, 705, 470, 245, 625, 675, 375, 590, 675, 390, 230, 125, 165, 605, 220, 535, 385, 295, 740, 645, 570, 460, 165, 585, 550, 555, 265, 420, 135, 740, 90, 260, 690, 290, 295, 405, 675, 585, 315, 570, 290, 740, 205];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isOscillating()).toBe(LAMBDA_WORKING);
        expect(lambda.isHeaterFaulty()).toBe(LAMBDA_HEATER_FAULTY);
    })

    it('fast oscillations', () => {
        const lambdaProfile = [435,435,435,435,435,435,435,435,435,435,435,435,435,435,435,435,435,420,435,435,435,435,435,435,435,435,435,435,435,435,440,440,435,440,435,435,435,435,435,440,440,440,440,440,445,445,450,455,455,465,470,475,485,495,505,515,530,540,555,570,590,605,625,640,660,675,680,660,650,635,605,550,535,425,445,405,330,285,255,240,225,210,190,190,250,330,520,345,265,505,390,505,400,215,235,410,435,270,540,335,270,370,535,560,295,530,400,355,320,335,300,295,285,555,345,385,390,390,320,170,365,320,370,535,500,340,455,555,240,290,435,305,475,165,570,270,600,165,180,775,775,905,880,160,405,130,135,220,180,170,150,215,210,275,470,580,180,550,265,325,525,600,770,585,345,180,815,690,155,570,200,880,910,620,305,220,790,475,405,255,465,460,115,790,640,275,400,280,365,745,540,405,550,300,330,160,325,160,255,415,225,265,695,250,665,500,695,555,165,430,660,615,595,660,235,735,365,205,685,325,200,230,785,400,175,300,185,220,300,575,225,530,150,685,320,650,135,290,445,175,370,295,530,320,280,405,470,610,265,265,370,730,515,470,575,375,390,520,705,470,245,625,675,375,590,675,390,230,125,165,605,220,535,385,295,740,645,570,460,165,585,550,555,265,420,135,740,90,260,690,290,295,405,675,585,315,570,290,740,205,730,810,690,435,360,120,110,430,665,560,515,680,175,255,695,520,225,235,410,460,750,165,675,100,210,140,475,170,265,800,280,390,205,725,360,810,810,180,100,775,105,505,740,505,110,110,815,240,260,770,275,95,385,95,230,790,535,90,780,655,805,265,620,105,775,100,680,740,120,805,650,795,105,670,95,125,145,800,800,345,740,310,110,695,480,95,810,755,105,65,65,600,780,210,70,165,80,780,775,230,400,230,795,560,560,780,100,100,760,805,750,810,135,235,100,815,405,405,405,795,115,110,230,825,105,795,740,105,690,775,700,225,75,350,720,105,95,550,620,785,495,90,800,100,815,740,335,95,70,315,335,790,665,605,190,85,145,755,150,185,325,810,445,310,175,795,755,815,745,540,500,200,80,770,235,120,725,115,80,540,335,285,750,285,725,260,210,100,610,165,775,795,615,110,325,255,675,125,745,115,830,135,360,305,675,265,120,315,810,830,820,425,185,140,700,810,810,100,740,110,795,435,135,605,825,830,105,145,785,105,300,825,745,180,175,795,570,115,340,730,835,445,100,735,440,395,540,765,820,640,100,90,180,720,280,525,555,85,785,370,730,100,65,520,245,620,685,410,85,170,660,575,180,690,85,675,165,775,105,415,105,70,100,775,590,750,145,90,75,80,805,100,800,310,790,505,80,80,245,775,750,115,70,335,810,445,435,150,80,815,795,120,300,115,470,110,815,400,85,240,495,800,665,380,760,100,85,710,820,140,85,145,630,605,805,130,385,790,320,455,175,145,805,825,810,565,105,90,270,70,725,775,830,800,120,270,190,810,190,90,75,755,170,795,845,255,85,75,95,590,770,250,250,640,735,150,350,690,290,740,470,740,85,200,735,720,80,125,335,770,715,265,95,85,195,545,595,420,235,90,170,765,640,95,715,315,450,80,270,405,730,430,620,105,215,300,690,805,400,190,420,95,155,640,270,705,660,770,795,210,100,710,400,390,125,100,375,305,270,535,605,690,210,550,675,470,405,285,475,350,235,160,120,275,730,410,505,605,595,185,675,675,115,135,605,225,470,345,430,230,275,270,645,415,595,330,200,150,150,640,375,385,510,240,715,140,445,155,705,285,685,160,240,740,120,645,100,600,775,100,605,355,470,525,200,590,690,145,320,265,650,215,360,165,505,120,295,605,640,385,725,190,585,580,140,325,155,110,235,355,105,125,340,115,255,165,530,430,420,640,115,475,225,600,655,235,390,420,130,505,540,115,420,635,260,445,700,300,105,675,565,770,155,440,195,380,700,280,215,105,95,595,710,810,85,365,220,495,350,670,210,100,540,280,705,130,80,490,360,90,90,590,680,120,770,435,715,475,490,130,135,555,590,265,640,110,285,585,195,295,390,285,690,740,445,490,210,165,585,150,160,430,570,195,505,220,485,600,205,265,100,400,270,570,310,420,115,145,540,335,335,160,255,650,375,610,655,545,370,675,300,305,190,230,455,610,280,665,235,715,210,475,270,660,135,270,385,445,485,115,155,360,165,165,670,380,615,490,370,255,605,270,350,235,730,155,520,415,125,270,640,250,100,585,670,580,200,670,260,660];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isSluggish()).toBe(LAMBDA_FAULTY);
    })

    it('sluggish oscillations', () => {
        const lambdaProfile = [440,440,440,440,440,440,440,440,435,440,440,440,440,440,440,440,440,440,440,440,435,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,445,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,450,445,450,450,440,445,445,445,445,440,445,440,440,440,440,445,445,445,445,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,445,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,440,445,445,445,445,450,450,460,465,470,475,480,485,495,500,505,515,520,530,540,545,550,560,565,570,570,585,595,605,605,605,610,570,545,520,505,495,475,465,465,460,445,475,455,430,415,400,390,380,375,370,370,360,365,360,355,350,345,345,340,340,335,335,330,325,320,310,300,290,285,285,275,270,265,265,280,265,285,270,265,270,280,275,285,310,335,570,435,390,355,335,320,305,300,295,290,290,285,285,310,330,340,450,395,370,340,330,315,300,295,295,290,290,285,310,675,600,500,435,395,370,345,335,325,315,310,300,285,355,350,320,300,295,285,275,270,265,275,270,270,270,270,350,505,415,360,325,310,295,285,275,270,275,280,390,525,545,640,480,405,360,330,315,305,300,895,930,670,760,580,520,480,640,675,640,855,895,895,885,875,875,780,740,635,510,415,370,340,325,305,300,285,280,275,270,270,270,260,260,255,255,255,280,450,865,535,490,395,355,325,300,290,280,0,285,290,290,305,370,465,565,410,350,0,300,285,295,340,325,560,435,370,325,0,295,295,300,355,470,385,335,300,295,0,350,580,425,340,300,295,285,315,450,0,315,285,475,335,290,285,400,355,0,745,565,440,360,320,290,280,300,0,375,300,275,270,260,260,300,610,0,520,395,325,300,280,265,380,310,0,555,785,700,595,505,435,465,415,440,400,370,335,315,300,280,270,355,330,305,280,270,270,260,270,270,325,335,475,395,350,395,360,315,300,300,310,285,330,310,855,765,605,645,490,460,395,355,360,330,320,300,285,275,280,275,270,320,280,280,265,260,270,515,400,350,355,305,300,280,295,345,655,645,500,415,365,335,315,300,290,285,290,300,315,355,305,310,395,405,740,770,575,475,420,400,355,335,335,305,285,275,270,270,270,280,305,275,265,255,325,330,700,575,465,405,355,330,315,290,285,335,500,515,405,375,405,325,300,315,355,405,370,325,540,650,475,415,345,310,300,285,270,265,260,250,245,240,300,620,500,475,480,405,365,335,310,295,280,270,275,270,260,250,585,855,740,590,455,400,450,405,355,335,325,300,280,270,290,270,260,270,260,285,675,555,445,375,335,300,290,280,320,295,320,515,450,365,320,300,270,265,255,315,660,455,375,310,300,275,290,345,470,345,300,280,270,335,615,475,375,330,300,285,275,270,265,285,370,390,675,410,350,310,295,325,300,530,355,300,285,270,450,610,420,350,310,285,280,280,265,270,280,295,335,365,355,370,640,675,790,825,790,810,540,440,400,355,330,305,0,285,280,265,270,355,305,335,520,345,295,275,290,505,470,345,305,285,270,255,555,780,765,530,405,375,330,305,290,285,395,370,315,645,455,390,335,295,285,270,270,275,275,270,300,390,365,525,385,300,325,335,610,405,340,340,340,305,325,335,425,585,460,320,285,270,280,325,445,390,310,275,305,295,705,495,480,370,320,295,275,375,565,445,330,300,315,295,370,560,640,420,350,315,295,330,355,295,540,530,360,320,295,370,435,450,435,325,280,290,265,270,435,670,510,335,320,280,445,405,315,300,300,435,335,320,280,385,525,350,315,300,370,705,570,340,300,290,300,270,350,540,445,340,320,305,335,470,605,380,305,295,270,270,245,375,270,250,290,260,235,225,215,210,795,855,850,945,730,975,850,965,980,975,970,960,945,895,735,500,395,360,335,300,285,275,265,255,245,235,235,225];
        const dataframes = createDataframesWithLambdaProfile(lambdaProfile);
        const lambda = new Lambda(dataframes);
        expect(lambda.isSluggish()).toBe(LAMBDA_FAULTY);
    })
})

function createDataframesWithLambdaProfile(profile) {
    let dataframeLog = new DataframeLog();

    for (let i = 0; i < profile.length; i++) {
        let df = createValidDataframe();
        df.df7d._7Dx06_LambdaVoltage = profile[i];
        df.df80._80x00_Time = getDateTimeString(i * 1000); // dataframes at 1 second intervals
        df.df7d._7Dx00_Time = df.df80._80x00_Time;

        dataframeLog.addDataframe(df.df7d);
        dataframeLog.addDataframe(df.df80);
    }

    return dataframeLog.dataframes;
}