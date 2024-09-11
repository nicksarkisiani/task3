import Table from 'cli-table';
import crypto from 'crypto';

process.stdin.setEncoding('utf8');

class Game {
    constructor() {
        this.rules = new Rules();
        this.hash = new Hash();
        this.console = new Console();
    }

    startGame(moves) {
        const canStart = this.checkConditions(moves)
        if (!canStart) return
        const movesObject = this.rules.checkMoves(moves)
        const hash = this.hash.startHashing(moves);
        const lines = this.console.printCommands(moves, hash.hmac)
        process.stdout.write(lines);
        this.console.startConsoling(moves, movesObject, hash)
    }

    checkConditions(moves) {
        let set = new Set(moves)
        if(moves.length < 3) {
            console.log("The number of moves must be at least 3");
            return false;
        }
        if(moves.length % 2 === 0) {
            console.log("The number of moves must be odd")
            return false;
        }
        if(set.size !== moves.length) {
            console.log("All moves must be unique")
            return false;
        }
        return true
    }

}

class Rules {
    checkMoves(movesArr) {
        const half = Math.floor(movesArr.length / 2);
        const result = {};

        for (let i = 0; i < movesArr.length; i++) {
            let defeat = [];
            let victory = [];

            for (let j = 1; j <= half; j++) {
                victory.push(movesArr[(i + j) % movesArr.length]);
            }

            for (let j = 1; j <= half; j++) {
                defeat.push(movesArr[(i - j + movesArr.length) % movesArr.length]);
            }

            result[movesArr[i]] = {
                win: victory,
                lose: defeat,
                draw: movesArr[i]
            };
        }

        return result;
    }

}

class Hash {
    generateKey() {
        return crypto.randomBytes(32).toString('hex');

    }

    getRandomInt(n) {
        return Math.floor(Math.random() * n);
    }

    computerChoice(moves) {
        return this.getRandomInt(moves.length)

    }

    generateHmac(elem, key) {
        elem = String(elem);
        return  crypto.createHmac('sha3-256', key)
            .update(elem)
            .digest('hex');
    }

    startHashing(moves) {
        const key = this.generateKey();
        const choice = this.computerChoice(moves);

        return {
            key,
            choice: moves[choice],
            choiceIndex: choice,
            hmac: this.generateHmac(moves[choice], key)
        }
    }
}

class Console {
    startConsoling(moves, movesObject, hash) {
        process.stdin.on('data', (choice) => {
            choice = choice.trim();
            if (choice === '0') {
                console.log("Exiting game.");
                process.exit();
            } else if (choice === '?') {
                this.printHelp(moves, movesObject);
            } else {
                const userChoice = parseInt(choice, 10);
                if (isNaN(userChoice) || userChoice < 1 || userChoice > moves.length) {
                    console.log("Invalid choice.");
                    process.exit()
                } else {
                    const movesOpponents = movesObject[hash.choice];
                    const userMove = moves[userChoice - 1];

                    if (movesOpponents.lose.includes(userMove)) {
                        console.log(`You lose! HMAC key: ${hash.key}`);
                    } else if (movesOpponents.win.includes(userMove)) {
                        console.log(`You win! HMAC key: ${hash.key}`);
                    } else {
                        console.log(`Draw! HMAC key: ${hash.key}`);
                    }
                    process.exit()
                }

            }

        });

    }

    printHelp(moves, movesObject) {
        const table = new Table({
            head: ["v PC\\User >", ...moves]
        });
        for (let i = 0; i < moves.length; i++) {
            let row = [moves[i]];
            for (let j = 0; j < moves.length; j++) {
                if (movesObject[moves[i]].win.includes(moves[j])) {
                    row.push("Win");
                } else if (movesObject[moves[i]].lose.includes(moves[j])) {
                    row.push("Lose");
                } else {
                    row.push("Draw");
                }
            }
            table.push(row);
        }
        console.log(table.toString());

    }

    printCommands(moves, key) {
        const lines = [];
        lines.push(`HMAC: ${key}`);
        lines.push("Available moves:");
        for (let i = 0; i < moves.length; i++) {
            lines.push(`${i + 1} - ${moves[i]}`);
        }
        lines.push('0 - exit');
        lines.push('? - help');
        lines.push("Enter your move: ");
        return lines.join('\n');
    }
}

const moves = process.argv.slice(2)

const game = new Game()
game.startGame(moves)
