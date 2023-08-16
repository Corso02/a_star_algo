import 'colorts/lib/string'
import * as fs from "fs"
const readLineSync = require("readline-sync")

enum TileType {
    Start,
    End,
    Path,
    Obstacle,
    FinalPath
}

class TileTypeUtil{
    static toString(type: TileType){
        switch(type){
            case TileType.End: return 'E'
            case TileType.Obstacle: return 'X'
            case TileType.Path: return '1'
            case TileType.Start: return 'S'
            case TileType.FinalPath: return 'F'
            default: return 'U'
        }
    }
}

class Tile{
    xPos: number
    yPos: number
    type: TileType
    fParam: number
    gParam: number
    hParam: number
    neighbours: Tile[]
    parent: Tile | null
   

    constructor(xPos: number, yPos: number, type: TileType){
        this.xPos = xPos
        this.yPos = yPos
        this.type = type
        this.fParam = Infinity
        this.gParam = Infinity
        this.hParam = Infinity
        this.neighbours = []
        this.parent = null
    }

    changeType(newType: TileType){
        this.type = newType
    }

    toString(){
        return TileTypeUtil.toString(this.type)
    }

    calculateManhattanDistance(endTile: Tile){
        let distance: number = Math.abs(this.xPos - endTile.xPos) + Math.abs(this.yPos - endTile.yPos)
        //console.log(`Vypocital som: ${distance}`)
        this.hParam = distance
    }
    setG(g: number){
        this.gParam = g
    }
    setF(){
        this.fParam = this.gParam + this.hParam
    }
    setH(h: number){
        this.hParam = h
    }
    isEnd(){
        return this.type === TileType.End
    }
    isStart(){
        return this.type === TileType.Start
    }
    isPath(){
        return this.type === TileType.Path
    }
    isObstacle(){
        return this.type === TileType.Obstacle
    }
    isFinalPath(){
        return this.type === TileType.FinalPath
    }
    updateNeighbours(field: Tile[][]){
        let i = Number(this.yPos)
        let j = Number(this.xPos)
        if(i < field.length - 1 && !field[i + 1][j].isObstacle())
            this.neighbours.push(field[i + 1][j])
        if(i > 0 && !field[i - 1][j].isObstacle())
            this.neighbours.push(field[i - 1][j])
        if(j < field[0].length - 1 && !field[i][j + 1].isObstacle())
            this.neighbours.push(field[i][j + 1])
        if(j > 0 && !field[i][j - 1].isObstacle())
            this.neighbours.push(field[i][j - 1])
    }
}

class Field{
    field: Tile[][]
    width: number
    height: number
    start: Tile | null
    end: Tile | null
    openSet: Tile[]
    closeSet: Tile[]
    path: Tile[]

    constructor(width: number, height: number){
        this.width = width
        this.height = height
        this.field = Array.from({length: this.height}, (_, yPos) => Array.from({length: this.width}, (_, xPos) => new Tile(xPos, yPos, TileType.Path)))
        this.start = null
        this.end = null
        this.openSet = []
        this.closeSet = []
        this.path = []
    }

    generateTableDelimiter(){
        let part: String = "+---"
        return part.repeat(this.width).concat("+")
    }

    printField(){
        let delimiter: String = this.generateTableDelimiter()
        console.log(delimiter)
        for(let i = 0; i < this.height; i++){
            process.stdout.write("| ")
            for(let j = 0; j < this.width; j++){
                if(this.field[i][j].isFinalPath())
                    process.stdout.write('F '.green)
                else if(this.field[i][j].isObstacle())
                    process.stdout.write('O '.red)
                else
                    process.stdout.write(`${TileTypeUtil.toString(this.field[i][j].type)} `)
                process.stdout.write("| ")
            }
            console.log(`\n${delimiter}`)
        }
    }

    setTile(xPos: number, yPos: number, type: TileType){
        if(xPos >= this.width || xPos < 0)
            console.log(`Error when changing tile type on X: ${xPos}! Expected xPos to be within 0 and ${this.width - 1}`)
        else if(yPos >= this.height || yPos < 0)
            console.log(`Error when changing tile type on Y: ${yPos}! Expected yPos to be within 0 and ${this.height - 1}`)
        else{
            if(this.field[yPos][xPos].type === type){
                this.field[yPos][xPos].changeType(TileType.Path)
                if(type === TileType.Start)
                    this.start = null
                if(type === TileType.End)
                    this.end = null
            }
            else{
                if(type === TileType.Start)
                    this.start = this.field[yPos][xPos]
                if(type === TileType.End)
                    this.end = this.field[yPos][xPos]
                this.field[yPos][xPos].changeType(type)
            }
        }     
    }

    findNext(openList: Tile[]){
        let min: number = Infinity
        let idx: number = -1
        for(let i = 0; i < openList.length; i++){
            if(openList[i].fParam < min)
                idx = i
        }
        return idx
    }

    checkOpenList(openList: Tile[], tileToCheck: Tile){
        return openList.some((tile: Tile) => tile.xPos === tileToCheck.xPos && tile.yPos === tileToCheck.yPos && tile.fParam < tileToCheck.fParam)
    }

    checkClosedList(closeList: Tile[], tileToCheck: Tile){
        return closeList.some((tile: Tile) => tile.xPos === tileToCheck.xPos && tile.yPos === tileToCheck.yPos && tile.fParam < tileToCheck.fParam)
    }

    resetField(){
        for(let i = 0; i < this.height; i++){
            for(let j = 0; j < this.width; j++){
                this.field[i][j].neighbours = []
                if(this.field[i][j].type === TileType.FinalPath)
                    this.setTile(j, i, TileType.Path)
            }
        }
    }
    
    findPath(){
        if(this.start === null)
            console.log('Start tile is not set! Set start tile before trying to find a path.')
        else if(this.end === null)
            console.log('End tile is not set! Set end tile before trying to find a path.')
        else{
            this.closeSet = []
            this.openSet = []
            this.resetField()
            for(let i = 0; i < this.height; i++){
                for(let j = 0; j < this.width; j++){
                    this.field[i][j].updateNeighbours(this.field)
                }
            }

            this.openSet.push(this.start)

            while(this.openSet.length > 0){
                let idx = 0
                for(let i = 0; i < this.openSet.length; i++){
                    if(this.openSet[i].fParam < this.openSet[idx].fParam)
                        idx = i
                }

                let curr = this.openSet[idx]

                // create final path
                if(curr.isEnd()){
                    let tmp = curr
                    while(tmp.parent){
                        tmp = tmp.parent
                        if(!this.field[tmp.yPos][tmp.xPos].isEnd() && !this.field[tmp.yPos][tmp.xPos].isStart()){
                            this.field[tmp.yPos][tmp.xPos].changeType(TileType.FinalPath)
                        }
                    }
                    return true
                }

                this.openSet.splice(idx, 1)
                this.closeSet.push(curr)

                let neighbours = curr.neighbours

                for(let i = 0; i < neighbours.length; i++){
                    let neighbour = neighbours[i]
                    

                    if(!this.closeSet.includes(neighbour)){
                        let possibleG = curr.gParam + 1
                        
                        if(!this.openSet.includes(neighbour))
                            this.openSet.push(neighbour)
                        else if(possibleG >= neighbour.gParam)
                            continue
                        
                        neighbour.gParam = possibleG
                        neighbour.calculateManhattanDistance(this.end)
                        neighbour.setF()
                        neighbour.parent = curr
                    }
                }
            }
        }
        return false
    }

    parseField(field: Tile[][]){
        for(let i = 0; i < field.length; i++){
            for(let j = 0; j < field[0].length; j++){
                this.field[i][j].changeType(field[i][j].type)
                if(field[i][j].type === TileType.Start)
                    this.start = this.field[i][j]
                if(field[i][j].type === TileType.End)
                    this.end = this.field[i][j]
            }
        }
    }
}

class ConsoleUi{

    field: Field | null

    constructor(){
        this.field = null
    }

    printMenu(){
        console.log("+----------------------------+")
        console.log("|       " + "1. New field".cyan + "         |")
        console.log("|       " + "2. Add start".cyan + "         |")
        console.log("|       " + "3. Add end".cyan + "           |")
        console.log("|       " + "4. Add obstacle".cyan + "      |")
        console.log("|       " + "5. Find path".cyan + "         |")
        console.log("|       " + "6. Print field".cyan + "       |")
        console.log("|       " + "7. Import field".cyan + "      |") 
        console.log("|       " + "8. Export field".cyan + "      |")
        console.log("|       " + "9. End program".cyan + "       |")
        console.log("+----------------------------+")
        this.selectMenuOption()
    }

    selectMenuOption(){
        let choice = readLineSync.question("Pick an option\n")
        while(!(/^[1-9]$/.test(choice))){
            choice = readLineSync.question("Please pick a valid option!\n".red)
        }
        switch(choice){
            case "1": this.setNewField()
                      break
            case "2": this.setTitle(TileType.Start)
                      break
            case "3": this.setTitle(TileType.End)
                      break
            case "4": this.setTitle(TileType.Obstacle)
                      break
            case "5": this.findPath()
                      break
            case "6": this.printField()
                      break
            case "7": this.importFromFile()
                      break
            case "8": this.exportToFile()
                      break
            case "9": this.endProgram()
                      break
        }
    }

    setNewField(){
        let width = this.getNumberInput("Enter field width.\n", "Wrong input! Please enter valid number\n")
        let height = this.getNumberInput("Enter field height.\n", "Wrong input! Please enter valid number\n")
        this.field = new Field(width, height)
        console.clear()
        //console.log(JSON.stringify(this.field))
        this.printMenu()
    }

    getNumberInput(message: String, errorMessage: String){
        let number = readLineSync.question(message.yellow)
        while(!(/^\d*$/.test(number))){
            number = readLineSync.question(errorMessage.red)
        }
        return Number(number)
    }

    getTilePosition(getCol: boolean){
        if(this.field === null){
            console.log("Field is not defined.\nPlease define field before trying to print".magenta)
            this.printMenu()
        }
        let strToAdd = getCol ? "col" : "row"
        let number = this.getNumberInput(`Enter ${strToAdd} number.\n`, `Invalid input detected! Enter valid ${strToAdd} number.\n`)
        while(number === 0 || (getCol && number > this.field.width) || (!getCol && number > this.field.height)){
            if(number === 0)
                console.log(`${strToAdd} number cannot be 0`.red)
            else if(getCol && number > this.field.width)
                console.log(`${strToAdd} cannot be greater than field width (${this.field.width})`)
            else
                console.log(`${strToAdd} cannot be greater than field height (${this.field.height})`)
            number = this.getNumberInput(`Enter ${strToAdd} number.\n`, `Invalid input detected! Enter valid ${strToAdd} number.\n`)
        }

        return Number(number) - 1 // -1 because array starts on index 0
    }

    setTitle(type: TileType){
        let col = this.getTilePosition(true)
        let row = this.getTilePosition(false)
        this.field.setTile(col, row, type)
        console.clear()
        this.printMenu()
    }

    findPath(){
        if(this.field === null){
            console.log("Field is not defined.\nPlease define field before trying to print".magenta)
            this.printMenu()
        }
        if(!this.field.findPath())
            console.log("PATH NOT FOUND!".red)
        this.printMenu()
    }

    endProgram(){
        console.log("Thank you for trying out my program :)".cyan)
        console.log("Created by Peter Vanát.".cyan)
    }

    printField(){
        if(this.field === null){
            console.log("Field is not defined.\nPlease define field before trying to print".magenta)
            this.printMenu()
        }
        else{
            console.clear()
            this.field.printField()
            this.printMenu()
        }
    }

    exportToFile(){
        if(this.field === null){
            console.log("Field is not defined.\nPlease define new field before trying to export it.".magenta)
            this.printMenu()
        }
        fs.opendir("./fields", async (err, dir) => {
            if(err){
                console.log("ERROR WHEN OPENING DIRECTORY 'fields'".red)
                return
            }
            let lastFileName = ""
            let file = await dir.read()
            while(file !== null){
                lastFileName = file.name
                file = await dir.read()
            }
            this.field.resetField()
            let newFileNumber = lastFileName.length === 0 ? 1 : Number(lastFileName.slice(5, lastFileName.indexOf(".")))+1
            let newFileName = `field${newFileNumber}.json`
            fs.writeFile(`./fields/${newFileName}`, JSON.stringify(this.field), {encoding: "utf-8"}, (err) => {
                if(err)
                    console.log("ERROR WHEN WRITING TO FILE".red)
                else
                    console.log("Field saved successfuly".cyan)
                this.printMenu()   
            })
        })
        
    }

    importFromFile(){
        let fileNumber = this.getNumberInput("Enter file number you want to import.\n", "Invalid input detected! Please input valid number.\n")
        let fileName = `field${fileNumber}.json`
        while(!fs.existsSync(`./fields/${fileName}`)){
            console.log("Invalid file number detected.\nEnter valid file number.\n".magenta)
            fileNumber = this.getNumberInput("Enter file number you want to import.\n", "Invalid input detected! Please input valid number.\n")
            fileName = `field${fileNumber}.json`
        }
        fs.readFile(`./fields/${fileName}`, (err, data) => {
            if(err){
                console.log("Error when trying to read from a file".red)
            }
            else{
                let obj = JSON.parse(data.toString())
                this.field = new Field(obj.width, obj.height)
                this.field.parseField(obj.field)
                console.log("Field loaded successfuly".cyan)
            }
            this.printMenu()
        })
    }

}
let ui = new ConsoleUi()

ui.printMenu()
