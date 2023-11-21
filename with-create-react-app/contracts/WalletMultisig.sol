// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*This error will be thrown whenever the user tries to approve a transaction that does not exist.*/
error txNotExist(uint transactionIndex);
/* This error will be thrown whenever the user tries to approve a transaction that has already been approved.*/
error TxAlreadyApproved(uint transactionIndex);
/* This error will be thrown whenever the user tries to approve a transaction that has already been sent.*/
error TxAlreadySent(uint transactionIndex);

contract WalletMultisig {
    // it will be emitted whenever the smart contract receives some ETH
    event Deposit(
       address indexed sander, 
       uint ethAmount,
       uint balance

       );
    /*it will be emitted whenever one of the owners tries to initiates a withdrawal of ETH from the smart contract */
    event CreateWithdrawTx(
       address indexed owner,
        uint indexed transactionIndex,
        address indexed to,
        uint amount

       );
    /* it will be emitted whenever one of the owners tries to approve an existing withdrawal transaction*/
    event ApproveWithdrawTx( 
       address indexed owner,
       uint indexed transactionIndex
       );

    // TODO: Declare an array to keep track of owners
    address [] public owners;
    /*  it will let us know whether a praticular address is one of the owners of the multisig smart contract wallet */
    mapping(address => bool) isOwner;
    // keep track of the total number of quorum required to approve a withdraw transaction
    uint public quorumRequired;
    /* it  will be used to keep track of withdraw transaction that owners create. This
           
    */
     struct WithdrawTx{
      address to;
      uint amount;
      uint approvals;
      bool sent;
  }
    /* it will keep track of whether a particular withdraw transaction has
     already been approved by the current caller. This is a mapping from transaction index => owner => bool
    */
    mapping(uint =>mapping(address => bool)) isApproved;

    // array of WithdrawTxstruct to keep track of the list of withdrawal transactions for this multisig wallet
    WithdrawTx []  WithdrawTxes;

    /*
      esempio di inserimento parametro array schermata remix: 
      ["0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2" ," 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db" , "0x0000000000000000000000000000000000000000"]
      ["0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2" ,"0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db " , "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"]
    */
    constructor (address []memory _owner, uint _quorum){
         require(_owner.length > 0,"deve esserci almeno un owner");
         require(_quorum > 0 && _quorum < _owner.length,"il quorum deve essere maggiore di 0 e inferiore a numero di owners");

         for(uint i = 0; i < _owner.length; i++){
            address owner = _owner[i];
            if(_owner[i] == 0x0000000000000000000000000000000000000000){
                revert("address non valido");
            }
            require(!isOwner[owner], "owner not unique"); // se una condizione e falsa allora restituisce vero ed esegue l errore

            isOwner[owner] = true;
            owners.push(owner);

            // assegnare valore di owner e quorum alle due rispettive variabili globali.
            quorumRequired = _quorum;

         }

    }

     /* TODO: Create a function called "createWithdrawTx" that is used to initiate the withdrawal 
             of ETH from the multisig smart contract wallet and does the following:
             1) Ensures that only one of the owners can call this function
             2) Create the new withdraw transaction(to, amount, approvals, sent) and add it to the list of withdraw transactions
             3) Emit an event called "CreateWithdrawTx"
    */
    function createWithdrawTx(address _to, uint _amount) public onlyOwner(){
        uint transactionIndex = WithdrawTxes.length;

        WithdrawTxes.push(WithdrawTx({to: _to,amount: _amount, approvals: 0, sent: false}));

        emit CreateWithdrawTx(msg.sender, transactionIndex , _to, _amount);
    }

    /* is used to approve the withdraw a particular transaction
             based on the transactionIndex(this is the index of the array of withdraw transactions)
             This function does the following:
             1) Ensures(verifica) that only one of the owners can call this function
             2) Ensures that the withdraw transaction exists in the array of withdraw transactions
             3) Ensures that the withdraw transaction has not been approved yet
             4) Ensures that the withdraw transaction has not been sent yet 
             5) Incremement the number of approvals for the given transaction
             6) Set the value of "isApproved" to be true for this transaction and for this caller
             7) If the numhber of approvals is greater than or equal to the number of quorum required, do the following:
                  - Set the value of "sent" of this withdraw transaction to be true
                  - Transfer the appropriate amount of ETH from the multisig wallet to the receiver
                  - Ensure that the transfer transaction was successful
                  - Emit an event called "ApproveWithdrawTx"
    */
    function approveWithdrawTx(uint _transacionIndex) public onlyOwner() transactionExists(_transacionIndex) transactionNotApproved(_transacionIndex) transactionNotSent(_transacionIndex){
       
            WithdrawTxes[_transacionIndex].approvals++;
            isApproved[_transacionIndex][msg.sender] = true;

            if(WithdrawTxes[_transacionIndex].approvals >= quorumRequired ){

                    WithdrawTxes[_transacionIndex].sent = true;


                    (bool sent,) = WithdrawTxes[_transacionIndex].to.call{value: WithdrawTxes[_transacionIndex].amount}("");
                    require(sent, "Failed to send Ether");
                    emit ApproveWithdrawTx(msg.sender, _transacionIndex);

            }

        
    }
    // TODO: Create a function called "getOwners" that retrieves(recuperare) the list of owners of the multisig wallet

    function getOwners() public view returns(address [] memory){
        return owners;

    }
    /* TODO: Create a function called "getWithdrawTxCount" that retrieves the total number of 
             withdrawal transactions for the multisig  wallet
    */
    function getWithdrawTxCount() view public returns(uint){
        return WithdrawTxes.length;
    }
    /* TODO: Create a function called "getWithdrawTxes" that retrieves all the withdraw transactions
             for the multisig wallet
    */
    function getWithdrawTxes() view public returns(WithdrawTx [] memory){
        return WithdrawTxes;
    }
    /* TODO: Create a function called "getWithdrawTx" that returns the withdraw transaction details 
             according to the transaction index in the array of withdraw transactions 
    */
    function getWithdrawTx(uint _transacionIndex)view  public returns(WithdrawTx  memory){
        return WithdrawTxes[_transacionIndex];
        /*
        function getWithdrawTx(uint _transactionIndex)
        public
        view
        returns (
            address to,
            uint amount,
            uint approvals,
            bool sent
        )
    {
        WithdrawTx storage withdrawTx = withdrawTxes[_transactionIndex];
        return (
            withdrawTx.to,
            withdrawTx.amount,
            withdrawTx.approvals,
            withdrawTx.sent
        );
    }



        */

    } 


    /* it will handle the receiving of ETH to this multisig wallet 
             Make sure to emit an event called "Deposit"
    */
    function deposit() payable public{

        emit Deposit(msg.sender, msg.value, address(this).balance);

    }
    // to handle the receiving of ETH 
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    //  gets the current amount of ETH in the multisig wallet
    function balanceOf() view public returns(uint){
        return address(this).balance;
    }




    // modifier onlyOwner()
    // that ensures that the function caller is one of the owners of the wallet
     modifier onlyOwner(){
       require(isOwner[msg.sender], "not owner"); // se e vero non eseguisce il comando
        _;

    }
    // that ensures that transaction exists in the list of withdraw transactions
    modifier transactionExists(uint transactionIndex){
        if(transactionIndex >= WithdrawTxes.length){
            revert txNotExist(transactionIndex);
        }
        _;

    }
    //  ensures that transaction has not yet been approved
    modifier transactionNotApproved(uint transactionIndex){
        if(isApproved[transactionIndex][msg.sender] == true){
                revert TxAlreadyApproved(transactionIndex);
        }
        _;
    }

    // that ensures that transaction has not yet been sent
    modifier transactionNotSent(uint transactionIndex){
        if(WithdrawTxes[transactionIndex].sent == true){
            revert TxAlreadySent(transactionIndex);
        }
        _;
    }

}
