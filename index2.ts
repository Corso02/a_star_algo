import 'colorts/lib/string'

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
    prev: Tile | null
    visited: boolean

    constructor(xPos: number, yPos: number, type: TileType){
        this.xPos = xPos
        this.yPos = yPos
        this.type = type
        this.fParam = 0
        this.gParam = 0
        this.hParam = 0
        this.prev = null
        this.visited = false
    }

    changeType(newType: TileType){
        this.type = newType
    }

    toString(){
        return TileTypeUtil.toString(this.type)
    }

    calculateManhattanDistance(endTile: Tile){
        let distance: number = Math.abs(this.xPos - endTile.xPos) + Math.abs(this.yPos - endTile.yPos)
        console.log(`Vypocital som: ${distance}`)
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
    setPrev(tile: Tile){
        this.prev = tile
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
}

class Field{
    field: Tile[][]
    width: number
    height: number
    start: Tile | null
    end: Tile | null

    constructor(width: number, height: number){
        this.width = width
        this.height = height
        this.field = Array.from({length: this.height}, (_, yPos) => Array.from({length: this.width}, (_, xPos) => new Tile(xPos, yPos, TileType.Path)))
        this.start = null
        this.end = null
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
            if(type === TileType.Start)
                this.start = this.field[yPos][xPos]
            if(type === TileType.End)
                this.end = this.field[yPos][xPos]
            this.field[yPos][xPos].changeType(type)
        }     
    }

    getSuccessors(tile: Tile){
        let successors: Tile[] = []
        if(tile.yPos + 1 < this.height && !this.field[tile.yPos + 1][tile.xPos].isObstacle() /*&& this.field[tile.yPos + 1][tile.xPos].isValidPath()*/){
            //this.field[tile.yPos + 1][tile.xPos].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos, tile.yPos + 1, this.field[tile.yPos + 1][tile.xPos].type)
            newTile.setPrev(tile)
            successors.push(newTile)   
        }
    
        if(tile.yPos - 1 >= 0 && !this.field[tile.yPos - 1][tile.xPos].isObstacle() /*&& this.field[tile.yPos - 1][tile.xPos].isValidPath()*/){
            //this.field[tile.yPos - 1][tile.xPos].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos, tile.yPos - 1, this.field[tile.yPos - 1][tile.xPos].type)
            newTile.setPrev(tile)
            successors.push(newTile) 
        }
    
        if(tile.xPos + 1 < this.width && !this.field[tile.yPos][tile.xPos + 1].isObstacle() /*&& this.field[tile.yPos][tile.xPos + 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos + 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos + 1, tile.yPos, this.field[tile.yPos][tile.xPos + 1].type)
            newTile.setPrev(tile)
            successors.push(newTile)
        }

        if(tile.xPos - 1 >= 0 && !this.field[tile.yPos][tile.xPos - 1].isObstacle() /*&& this.field[tile.yPos][tile.xPos - 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos - 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos - 1, tile.yPos, this.field[tile.yPos][tile.xPos - 1].type)
            newTile.setPrev(tile)
            successors.push(newTile)
        }
    
        return successors
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

    
    findPath(){
        if(this.start === null)
            console.log('Start tile is not set! Set start tile before trying to find a path.')
        else if(this.end === null)
            console.log('End tile is not set! Set end tile before trying to find a path.')
        else{
            let openList: Tile[] = [this.start]
            let closedList: Tile[] = []
            let found: boolean = false
            while(openList.length !== 0){
                let nextIdx: number = this.findNext(openList)
                let next: Tile = openList.splice(nextIdx, 1)[0]
                console.log(`NEXT F: ${next.fParam}`)
                console.log(next)
                let successors: Tile[] = this.getSuccessors(next)
                for(let i = 0; i < successors.length; i++){
                    let successor: Tile = successors[i]
                    if(successor.isEnd()){
                        this.end.setPrev(next)
                        found = true
                        break
                    }
                    successor.setG(next.gParam + 1)
                    successor.calculateManhattanDistance(this.end)
                    successor.setF()
                    if(this.checkOpenList(openList, successor /*this.field[successor.yPos][successor.xPos]*/))
                        continue
                    if(this.checkClosedList(closedList, successor /*this.field[successor.yPos][successor.xPos]*/))
                        continue
                    else{
                        this.field[successor.yPos][successor.xPos].setG(next.gParam + 1)
                        this.field[successor.yPos][successor.xPos].calculateManhattanDistance(this.end)
                        this.field[successor.yPos][successor.xPos].setF()
                        this.field[successor.yPos][successor.xPos].setPrev(next)
                        openList.push(this.field[successor.yPos][successor.xPos])
                        openList.push(successor)
                    }
                }
                console.log("open list:", openList)
                //break
                if(found)
                    break
                closedList.push(next)
            }
        }
    }

    constructPath(){
        let prev: Tile = this.end.prev
        while(!prev.isStart()){
            this.field[prev.yPos][prev.xPos].changeType(TileType.FinalPath)
            prev = prev.prev
        }
    }

    getSuccessors2(tile: Tile){
        let successors: Tile[] = []
        if(tile.yPos + 1 < this.height && !this.field[tile.yPos + 1][tile.xPos].isObstacle() && !this.field[tile.yPos + 1][tile.xPos].visited /*&& this.field[tile.yPos + 1][tile.xPos].isValidPath()*/){
            //this.field[tile.yPos + 1][tile.xPos].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos, tile.yPos + 1, this.field[tile.yPos + 1][tile.xPos].type)
           /*  newTile.setPrev(tile) */
           this.field[tile.yPos + 1][tile.xPos].visited = true
           successors.push(this.field[tile.yPos + 1][tile.xPos])
        }
    
        if(tile.yPos - 1 >= 0 && !this.field[tile.yPos - 1][tile.xPos].isObstacle() && !this.field[tile.yPos - 1][tile.xPos].visited /*&& this.field[tile.yPos - 1][tile.xPos].isValidPath()*/){
            //this.field[tile.yPos - 1][tile.xPos].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos, tile.yPos - 1, this.field[tile.yPos - 1][tile.xPos].type)
           /*  newTile.setPrev(tile) */
           this.field[tile.yPos - 1][tile.xPos].visited = true
           successors.push(this.field[tile.yPos - 1][tile.xPos])
        }
    
        if(tile.xPos + 1 < this.width && !this.field[tile.yPos][tile.xPos + 1].isObstacle() && !this.field[tile.yPos][tile.xPos + 1].visited /*&& this.field[tile.yPos][tile.xPos + 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos + 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos + 1, tile.yPos, this.field[tile.yPos][tile.xPos + 1].type)
           /*  newTile.setPrev(tile) */
           this.field[tile.yPos][tile.xPos + 1].visited = true
           successors.push(this.field[tile.yPos][tile.xPos + 1])
        }

        if(tile.xPos - 1 >= 0 && !this.field[tile.yPos][tile.xPos - 1].isObstacle() && !this.field[tile.yPos][tile.xPos - 1].visited /*&& this.field[tile.yPos][tile.xPos - 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos - 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos - 1, tile.yPos, this.field[tile.yPos][tile.xPos - 1].type)
           /*  newTile.setPrev(tile) */
           this.field[tile.yPos][tile.xPos - 1].visited = true
            successors.push(this.field[tile.yPos][tile.xPos - 1])
        }
    
        return successors
    }

    constructPath2(){
        this.start.visited = true
        let next: Tile = this.start
        while(!next.isEnd()){
            let successors: Tile[] = this.getSuccessors2(next)
            if(successors.some(tile => tile.xPos === this.end.xPos && tile.yPos === this.end.yPos))
                break
            let idx = this.findNext(successors)
            console.log(idx, successors, next)
            let newNext = this.field[successors[idx].yPos][successors[idx].xPos]
            
            newNext.changeType(TileType.FinalPath)
            next = newNext
        }
    }
}

let field: Field = new Field(5, 5)
field.setTile(0,0, TileType.Start)
field.setTile(4,4, TileType.End)
/* field.setTile(1,0, TileType.Obstacle)
field.setTile(1,1, TileType.Obstacle)
field.setTile(1,2, TileType.Obstacle)
field.setTile(1,3, TileType.Obstacle)
 */
field.printField()

console.log("FINDING PATH")

field.findPath()

console.log("FOUND")

field.constructPath2()

field.printField()

/*
+---+---+---+---+---+
| S | 1 | 1 | 1 | 1 |
+---+---+---+---+---+
| 1 | 1 | 1 | 1 | 1 |
+---+---+---+---+---+
| 1 | 1 | 1 | 1 | 1 |
+---+---+---+---+---+
| 1 | 1 | 1 | 1 | 1 |
+---+---+---+---+---+
| 1 | 1 | 1 | 1 | E |
+---+---+---+---+---+ */

