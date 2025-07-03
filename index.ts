import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as readline from 'readline-sync';

class Transaction{
    date: string;
    from: string;
    to: string;
    narrative: string;
    amount: number;

    constructor(date: string, from: string, to: string, narrative: string, amount: number) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = amount;
    }

    toString(): string{
        return `${this.date}: ${this.from} paid to ${this.to} ${this.amount} (${this.narrative})`
    }

}

class Account{
    name: string;
    balance: number = 0;
    transactions: Transaction[] = [];


    constructor(name: string) {
        this.name = name;
    }

    addTransaction(transaction: Transaction, isSender: boolean) {
        this.transactions.push(transaction);
        this.balance += isSender? -transaction.amount: transaction.amount;
    }
    printBalance(){
        console.log(`${this.name}: $${this.balance}`);
    }

    printTransactions(){
        console.log(`Transactions for ${this.name}: `);
        this.transactions.forEach((t) => {
            const role = t.from === this.name ? 'Paid' : 'Received';
            const other = t.from === this.name ? 't.to' : 't.from';
            console.log(`${t.date} : ${role} $${t.amount} ${role === 'Paid' ? 'to' : 'from'} ${other} (${t.narrative})`);
        });
    }

}

class SupportBank{
    accounts: Map<string, Account> = new Map();

    async loadCSV(filePath: string): Promise<void> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return new Promise((resolve, reject) =>{
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    for(const row of result.data as any[]){
                        const transaction = new Transaction(row.Date, row.From, row.To, row.Narrative, row.Amount);
                        let fromAccount = this.getOrCreateAccount((transaction.from));
                        let toAccount = this.getOrCreateAccount((transaction.to));

                        fromAccount.addTransaction(transaction, true);
                        toAccount.addTransaction(transaction, false);
                    }
                    resolve();
                },
                error: (error) => {
                    reject(error.message);
                },
            });
        });
    }

    getOrCreateAccount(name: string): Account {
        if(!this.accounts.has(name)) {
            this.accounts.set(name, new Account(name));
        }
        return this.accounts.get(name);
    }
    listAllAccounts(){
        this.accounts.forEach((account) => account.printBalance());
    }
    listAccount(name: string) {
        const account = this.accounts.get(name);
        if(!account){
            console.log('No account found.');
        }
        else{
            account.printTransactions();
        }
    }

    async run(){
        await this.loadCSV('Transactions2014.csv');

        while(true){
            const input = readline.question('Choose command: ListAll / ListAccount / Quit \n');
            if(input.toLowerCase() === 'quit')
                break;
            else if(input.toLowerCase() === 'listall')
                this.listAllAccounts();
            else if(input.toLowerCase() === 'listaccount')
            {
                const nameAccount = readline.question('Choose account name\n');
                this.listAccount(nameAccount);
            }
            else break;
        }
    }
}

const app = new SupportBank();
app.run();