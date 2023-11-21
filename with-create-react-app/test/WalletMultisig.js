const {loadFixture } = require ('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require ('hardhat');

describe('WalletMultisig', function() {
    async function deployFixture() {
        // destructuring assignment" assegno l oggetto/array signer che ha piu valori il primo a owner e il secondo a otherAccount
        // parentesi [] per array e parentesi {} per oggetti
        //console.log(await ethers.getSigners() );
        const [owner, otherAccount, lastAccount, enemy] = await ethers.getSigners();


       // console.log(await ethers.getContractFactory('EtherWallet') );
        const WalletMultisig = await ethers.getContractFactory('WalletMultisig');
        const walletmultisig = await WalletMultisig.deploy(["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","0x70997970C51812dc3A010C7d01b50e0d17dc79C8","0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"], 2);

        return { walletmultisig , owner, otherAccount, lastAccount,enemy};


    }
    describe('deployment', function(){
        it('Should deploy and set the owners to be deployed address', async function(){
            const { walletmultisig , owner, otherAccount , lastAccount} = await loadFixture(deployFixture);
            // Chiama la funzione del contratto per ottenere l'array di owners
            const owners = await walletmultisig.getOwners();
            // Verifica che ci siano esattamente 3 owners nell'array
            expect(owners.length).to.equal(3);
            // Verifica che ciascun owner passato come parametro sia presente nell'array
            expect(owners).to.include(owner.address);
            expect(owners).to.include(otherAccount.address);
            expect(owners).to.include(lastAccount.address);
            expect(await walletmultisig.quorumRequired()).to.equal(2);
           

        })
    })
    describe('deposit', function(){
        it('should deposit Ether to the contract', async function(){
            const { walletmultisig } = await loadFixture(deployFixture);

            const tx = await walletmultisig.deposit({
                value: ethers.parseEther('1')
            })
            await tx.wait();
            const balance = await ethers.provider.getBalance(await walletmultisig.getAddress() );
            expect(balance.toString()).to.equal(ethers.parseEther('1'));
        })

    })
    describe('createWIthdraw', function(){
        it('should create a new withdraw that it could be confirmed', async function(){
            const { walletmultisig } = await loadFixture(deployFixture);
            // creo il withdraw
            const tx = await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
            //accedo a tutti i withdraws
            const tx2 = await walletmultisig.getWithdrawTxes()
       
            expect(tx2[0].to).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(tx2[0].amount).to.equal(ethers.parseEther('1'));
            expect(tx2[0].approvals).to.equal(0);
            expect(tx2[0].sent).to.equal(false);
            expect(tx2.length).to.equal(1);
        })

    })
    describe('approveWIthdraw', function(){
        it('should approve a withdraw transaction', async function(){
            const { walletmultisig, owner } = await loadFixture(deployFixture);
            // creo il withdraw
            const tx = await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
            //approvo il withdraw
            const tx2 = await walletmultisig.connect(owner).approveWithdrawTx(0)
            //accedo a tutti i withdraws
            const tx3 = await walletmultisig.getWithdrawTxes()
       
            expect(tx3[0].to).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(tx3[0].amount).to.equal(ethers.parseEther('1'));
            expect(tx3[0].approvals).to.equal(1);
            expect(tx3[0].sent).to.equal(false);
            expect(tx3.length).to.equal(1);
        })

    })
    describe('two approveWIthdraw', function(){
        it('should approve a withdraw transaction and sand it', async function(){
            const { walletmultisig, owner, otherAccount } = await loadFixture(deployFixture);
            //mando gli eth al multisigwallet
            await walletmultisig.deposit({
                value: ethers.parseEther('2')
            })
            // creo il withdraw
            await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
            //approvo il withdraw
            await walletmultisig.connect(owner).approveWithdrawTx(0)
            await walletmultisig.connect(otherAccount).approveWithdrawTx(0)
            //accedo a tutti i withdraws
            const tx3 = await walletmultisig.getWithdrawTxes()
       
            expect(tx3[0].to).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(tx3[0].amount).to.equal(ethers.parseEther('1'));
            expect(tx3[0].approvals).to.equal(2);
            expect(tx3[0].sent).to.equal(true);
            expect(tx3.length).to.equal(1);
        })

    })
    describe('three approveWIthdraw', function(){
        it('should approve a withdraw transaction with the other two account and sand it', async function(){
            const { walletmultisig, otherAccount , lastAccount} = await loadFixture(deployFixture);
            //mando gli eth al multisigwallet
            await walletmultisig.deposit({
                value: ethers.parseEther('2')
            })
            // creo il withdraw
            const tx = await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
            await tx.wait();
            //approvo il withdraw
            await walletmultisig.connect(lastAccount).approveWithdrawTx(0)
            await walletmultisig.connect(otherAccount).approveWithdrawTx(0)
            //accedo a tutti i withdraws
            const tx3 = await walletmultisig.getWithdrawTxes()
       
            expect(tx3[0].to).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(tx3[0].amount).to.equal(ethers.parseEther('1'));
            expect(tx3[0].approvals).to.equal(2);
            expect(tx3[0].sent).to.equal(true);
            expect(tx3.length).to.equal(1);
        })

    })
/////// partono i revert
    describe('enemy try to createWIthdraw', async function(){
        it('Should revert the tx when withdraw is called by someone other than the owner', async function () {
            const { walletmultisig , enemy} = await loadFixture(deployFixture);

            await expect(
                  walletmultisig.connect(enemy).createWithdrawTx(enemy, ethers.parseEther('1'))).to.be.revertedWith("not owner")
       })
    })

    describe('enemy try to approveWIthdraw', async function(){
        it('Should revert the tx when withdraw is called by someone other than the owner', async function () {
            const { walletmultisig , enemy} = await loadFixture(deployFixture);
            //creo il withdraw
            await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
            
            await expect(
                  walletmultisig.connect(enemy).approveWithdrawTx(0)).to.be.revertedWith("not owner")
       })

       it('Should revert the tx when someone try to approve 2 times the same withdraw', async function () {
        const { walletmultisig , owner} = await loadFixture(deployFixture);
        //creo il withdraw
        await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
        await walletmultisig.connect(owner).approveWithdrawTx(0);
        await expect(
              walletmultisig.connect(owner).approveWithdrawTx(0)).to.be.revertedWithCustomError(walletmultisig,"TxAlreadyApproved").withArgs(0);
       })

       it('Should revert if the withdraw dont exist', async function () {
        const { walletmultisig , owner} = await loadFixture(deployFixture);        
        await expect(
              walletmultisig.connect(owner).approveWithdrawTx(0)).to.be.revertedWithCustomError(walletmultisig,"txNotExist").withArgs(0);
       })

       it('Should revert if the withdraw is already sent', async function () {
        const { walletmultisig , owner,otherAccount, lastAccount } = await loadFixture(deployFixture);
        await walletmultisig.deposit({  value: ethers.parseEther('1')})

        await walletmultisig.createWithdrawTx("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",ethers.parseEther('1'))
        await walletmultisig.connect(owner).approveWithdrawTx(0);
        await walletmultisig.connect(otherAccount).approveWithdrawTx(0);        
        await expect(
              walletmultisig.connect(lastAccount).approveWithdrawTx(0)).to.be.revertedWithCustomError(walletmultisig,"TxAlreadySent").withArgs(0);
       })

    })


    /*
  
    
    describe('Withdrawal', function(){
        it('should withdraw ether from the contract with zero Eth', async function(){
            const {etherWallet , owner }=  await loadFixture(deployFixture);

            const tx = await etherWallet.connect(owner).withdraw(owner.address, ethers.parseEther('0'));
            await tx.wait();

            const balance = await ethers.provider.getBalance(await etherWallet.getAddress());
            expect(balance.toString()).to.equal(ethers.parseEther('0'));

        })

        it('should withdraw ether from the contract with zero Eth', async function(){
            const {etherWallet , owner }=  await loadFixture(deployFixture);
            
            const depositTx = await etherWallet.deposit({
                value: ethers.parseEther('1')
            })
            await depositTx.wait();
            //first deposit eth to do withdraw
            let balance = await ethers.provider.getBalance(await etherWallet.getAddress() );
            expect(balance.toString()).to.equal(ethers.parseEther('1'));

            const withdrawtx = await etherWallet.connect(owner).withdraw(owner.address, ethers.parseEther('1'));
            await withdrawtx.wait();

            balance = await ethers.provider.getBalance(await etherWallet.getAddress());
            expect(balance.toString()).to.equal(ethers.parseEther('0'));

        })
        it('should give error if it called from not the owner', async function(){
            const {etherWallet , owner, otherAccount } =  await loadFixture(deployFixture);
        

           await expect(await etherWallet.connect(otherAccount).withdraw(owner.address, ethers.parseEther('0'))).to.be.revertedWith('solo il propietario puo mandare ether');

        })

    })
    describe('mybalance', function(){
        it('mybalance should be equal contract balance', async function(){
            const {etherWallet , owner }=  await loadFixture(deployFixture);
            let balance = await ethers.provider.getBalance(await etherWallet.getAddress() ); // prendo il balance dello sc
            const tx = await etherWallet.myBalance(); // prendo balance da mybalance function
            
          //  console.log("balance ", balance);
    
            expect(tx).to.equal(balance);    
        })

        it('mybalance should be 1', async function(){
            const {etherWallet , owner }=  await loadFixture(deployFixture);
            const depositTX = await etherWallet.deposit({
                value: ethers.parseEther('1')
            })
            await depositTX.wait();

            let balance = await ethers.provider.getBalance(await etherWallet.getAddress() ); // prendo il balance dello sc

            const tx = await etherWallet.myBalance(); // prendo il balance dalla funzione mybalance


            console.log("tx: ", tx , "balance: ", balance);
            expect(tx).to.equal(balance);    // confronto il balance dello sc al balance della funzione
        })                
     })
*/
})