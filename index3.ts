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
    parentX: number
    parentY: number
    visited: boolean

    constructor(xPos: number, yPos: number, type: TileType){
        this.xPos = xPos
        this.yPos = yPos
        this.type = type
        this.fParam = Infinity
        this.gParam = Infinity
        this.hParam = Infinity
        this.parentX = -1
        this.parentY = -1
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
    setParent(x: number, y: number){
        this.parentX = x
        this.parentY = y
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
            newTile.setParent(tile.xPos, tile.yPos)
            successors.push(newTile)   
        }
    
        if(tile.yPos - 1 >= 0 && !this.field[tile.yPos - 1][tile.xPos].isObstacle() /*&& this.field[tile.yPos - 1][tile.xPos].isValidPath()*/){
            //this.field[tile.yPos - 1][tile.xPos].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos, tile.yPos - 1, this.field[tile.yPos - 1][tile.xPos].type)
            newTile.setParent(tile.xPos, tile.yPos)
            successors.push(newTile) 
        }
    
        if(tile.xPos + 1 < this.width && !this.field[tile.yPos][tile.xPos + 1].isObstacle() /*&& this.field[tile.yPos][tile.xPos + 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos + 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos + 1, tile.yPos, this.field[tile.yPos][tile.xPos + 1].type)
            newTile.setParent(tile.xPos, tile.yPos)
            successors.push(newTile)
        }

        if(tile.xPos - 1 >= 0 && !this.field[tile.yPos][tile.xPos - 1].isObstacle() /*&& this.field[tile.yPos][tile.xPos - 1].isValidPath()*/){
            //this.field[tile.yPos][tile.xPos - 1].setPrev(tile)
            let newTile: Tile = new Tile(tile.xPos - 1, tile.yPos, this.field[tile.yPos][tile.xPos - 1].type)
            newTile.setParent(tile.xPos, tile.yPos)
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

    constructPath(cellDetails: Tile[][]){
        let row = this.end.yPos
        let col = this.end.xPos

        let path = []
        console.log(row, col)

        while(!this.field[row][col].isStart()){
            this.field[row][col].changeType(TileType.FinalPath)
            row = cellDetails[row][col].parentY
            col = cellDetails[row][col].parentX
        }

       /*  while(!(cellDetails[row][col].parentY == row && cellDetails[row][col].parentX == col)){
            path.push([row, col])
            row = cellDetails[row][col].parentY
            col = cellDetails[row][col].parentX
        }
        //path.push([row, col])

        while(path.length > 0){
            let p = path[0]
            path.shift()
            if(!this.field[p[0]][p[1]].isStart() && !this.field[p[0]][p[1]].isEnd())
                this.field[p[0]][p[1]].changeType(TileType.FinalPath)
        } */
    }

    
    findPath(){
        if(this.start === null)
            console.log('Start tile is not set! Set start tile before trying to find a path.')
        else if(this.end === null)
            console.log('End tile is not set! Set end tile before trying to find a path.')
        else{
            let closedList: Boolean[][] = Array.from({length: this.height}, _ => Array(this.width).fill(false))
            let cellDetails: Tile[][] = Array.from({length: this.height}, (_, yPos) => Array.from({length: this.width}, (_, xPos) => new Tile(xPos, yPos, this.field[yPos][xPos].type)))
            cellDetails[this.start.yPos][this.start.xPos].setParent(this.start.xPos, this.start.yPos)

            let openList = new Map()
            openList.set(0, [this.start.xPos, this.start.yPos])

            let destFound = false

            while(openList.size > 0){
                let p = openList.entries().next().value
              //  console.log(openList)

                openList.delete(p[0])
                

                let xPos = p[1][0]
                let yPos = p[1][1]
                closedList[yPos][xPos] = true
                
                //console.log(openList, xPos, yPos)

                if(xPos - 1 >= 0){
                    if(this.field[yPos][xPos - 1].isEnd()){
                        cellDetails[yPos][xPos - 1].setParent(xPos, yPos)
                        this.constructPath(cellDetails)
                        destFound = true
                        return
                    }
                    else if(closedList[yPos][xPos - 1] === false && !this.field[yPos][xPos - 1].isObstacle()){
                        let gNew: number = cellDetails[yPos][xPos].gParam + 1
                        cellDetails[yPos][xPos - 1].calculateManhattanDistance(this.end)
                        let hNew: number = cellDetails[yPos][xPos - 1].hParam
                        let fNew: number = gNew + hNew;
                        if(cellDetails[yPos][xPos - 1].fParam === Infinity || cellDetails[yPos][xPos - 1].fParam > fNew){
                            openList.set(fNew, [xPos - 1, yPos])
                            cellDetails[yPos][xPos - 1].setParent(xPos, yPos)
                            cellDetails[yPos][xPos - 1].fParam = fNew
                            cellDetails[yPos][xPos - 1].gParam = gNew
                            cellDetails[yPos][xPos - 1].hParam = hNew
                        }
                    }
                }

                if(xPos + 1 < this.width){
                    if(this.field[yPos][xPos + 1].isEnd()){
                        cellDetails[yPos][xPos + 1].setParent(xPos, yPos)
                        this.constructPath(cellDetails)
                        destFound = true
                        return
                    }
                    else if(closedList[yPos][xPos + 1] === false && !this.field[yPos][xPos + 1].isObstacle()){
                        let gNew: number = cellDetails[yPos][xPos].gParam + 1
                        cellDetails[yPos][xPos + 1].calculateManhattanDistance(this.end)
                        let hNew: number = cellDetails[yPos][xPos + 1].hParam
                        let fNew: number = gNew + hNew;
                        if(cellDetails[yPos][xPos + 1].fParam === Infinity || cellDetails[yPos][xPos + 1].fParam > fNew){
                            openList.set(fNew, [xPos + 1, yPos])
                            cellDetails[yPos][xPos + 1].setParent(xPos, yPos)
                            cellDetails[yPos][xPos + 1].fParam = fNew
                            cellDetails[yPos][xPos + 1].gParam = gNew
                            cellDetails[yPos][xPos + 1].hParam = hNew
                        }
                    }
                }

                if(yPos - 1 >= 0){
                    if(this.field[yPos - 1][xPos].isEnd()){
                        cellDetails[yPos - 1][xPos].setParent(xPos, yPos)
                        this.constructPath(cellDetails)
                        destFound = true
                        return
                    }
                    else if(closedList[yPos - 1][xPos] === false && !this.field[yPos - 1][xPos].isObstacle()){
                        let gNew: number = cellDetails[yPos][xPos].gParam + 1
                        cellDetails[yPos - 1][xPos].calculateManhattanDistance(this.end)
                        let hNew: number = cellDetails[yPos - 1][xPos].hParam
                        let fNew: number = gNew + hNew;
                        if(cellDetails[yPos - 1][xPos].fParam === Infinity || cellDetails[yPos - 1][xPos].fParam > fNew){
                            openList.set(fNew, [xPos, yPos - 1])
                            cellDetails[yPos - 1][xPos].setParent(xPos, yPos)
                            cellDetails[yPos - 1][xPos].fParam = fNew
                            cellDetails[yPos - 1][xPos].gParam = gNew
                            cellDetails[yPos - 1][xPos].hParam = hNew
                        }
                    }
                }
                
                if(yPos + 1 < this.height){
                    /* console.log("neheheh:",xPos, yPos)
                    console.log("hehe:", this.field[yPos + 1][xPos]) */
                    if(this.field[yPos + 1][xPos].isEnd()){
                        cellDetails[yPos + 1][xPos].setParent(xPos, yPos)
                        this.constructPath(cellDetails)
                        destFound = true
                        return
                    }
                    else if(closedList[yPos + 1][xPos] === false && !this.field[yPos + 1][xPos].isObstacle()){
                        let gNew: number = cellDetails[yPos][xPos].gParam + 1
                        cellDetails[yPos + 1][xPos].calculateManhattanDistance(this.end)
                        let hNew: number = cellDetails[yPos + 1][xPos].hParam
                        let fNew: number = gNew + hNew;
                        if(cellDetails[yPos + 1][xPos].fParam === Infinity || cellDetails[yPos + 1][xPos].fParam > fNew){
                            openList.set(fNew, [xPos, yPos + 1])
                            cellDetails[yPos + 1][xPos].setParent(xPos, yPos)
                            cellDetails[yPos + 1][xPos].fParam = fNew
                            cellDetails[yPos + 1][xPos].gParam = gNew
                            cellDetails[yPos + 1][xPos].hParam = hNew
                        }
                    }
                }

            }
            
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

