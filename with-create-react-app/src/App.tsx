import { ConnectButton } from '@rainbow-me/rainbowkit';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState , useEffect} from 'react';
import WalletMultisig from "./contractABI/WalletMultisig.json";
import { useContractRead } from 'wagmi';
import { useWalletClient } from 'wagmi' //old useSIgner
import { useContractWrite, usePrepareContractWrite } from 'wagmi' 
const { ethers } = require("ethers");



const App = () => {
/// template to save withdraw transactions
  type withdrawTemplate = {
    transactionIndex: number;
    to: string;
    amount: number;
    approvals: String;
    sent: boolean;
  };
   // SC address ottenuto dal deploy
  const scaddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  // owners of the wallet
  const [owners, setOwners] = useState("");
  //total number of transaction
  const [totalWithdraw, setTotalWithdrwa] = useState(0);
  //multisig Smart contract balance
  const [scBalance, setscBalance] = useState(0);
  // for deposit
  const[ethToUseForDeposit, setEthToUseForDeposit] = useState('0');
  // auxiliary to avoid input errors
  const[spotEthToUseForDeposit, setSpotEthToUseForDeposit] = useState('0');
  //for withdraw
  const [withdrawBalance, setBalanceWithdraw] = useState('0');
  const [addressWithdraw, setAddressWithdraw] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  // auxiliary to avoid input errors
  const [spotWithdrawBalance, setSpotBalanceWithdraw] = useState('0');
  const [spotAddressWithdraw, setSpotAddressWithdraw] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  //array to set all values obtained from withdrawtxes
  const [withdrawTxes, setWithdrawTxes] = useState<Array<withdrawTemplate>>([]);
  ////////////////auxiliary to avoid input errors
  const [spotIndexConfirmTransaction, setSpotIndexConfirmTransaction] = useState("");
  /// for withdrawtxes
  const[indexConfirmTransaction, setIndexConfirmTransaction] = useState("");

 

////view ether balance in the wallet
  const  contractBalance = useContractRead({
    address: scaddress,
    abi: WalletMultisig,
    functionName: 'balanceOf',
    watch: true ,
    onSuccess(data) {
      console.log(data);
    },
    onError(error) {
      console.log(error);
    }
  });
  useEffect(() =>{
  if(contractBalance.data){
    let temp =  Number(contractBalance.data)/ 10 ** 18;
    setscBalance(temp);
  }
 },[contractBalance.data])
///////  end control about ether inside multisig


// read the addresses of the multisig contract
// perfezionare la lettura degli address magari visualizzarli tutti staccati e mettere ogni address in una variabile
const  contractOwners = useContractRead({
  address: scaddress,
  abi: WalletMultisig,
  functionName: 'getOwners',
  watch: true ,
  onSuccess(data) {
    console.log(data);
  },
  onError(error) {
    console.log(error);
  }
});

useEffect(() =>{
  if(contractOwners.data){
    let own =  String(contractOwners.data)
    setOwners(own);
  }
 },[contractOwners.data])
/////////////////////////////////// end multisig read address
////////////////////read total number of withdrawEffected
const  contractTotalWithdraw = useContractRead({
  address: scaddress,
  abi: WalletMultisig,
  functionName: 'getWithdrawTxCount',
  watch: true ,
  onSuccess(data) {
    console.log(data);
  },
  onError(error) {
    console.log(error);
  }
});

useEffect(() =>{
  if(contractTotalWithdraw.data){
    let temp =  Number(contractTotalWithdraw.data)
    setTotalWithdrwa(temp);
  }
 },[contractTotalWithdraw.data])

///////////////////////////// and of reading

 const { data: walletClient } = useWalletClient(); // useSIgner

///////////////////////// prepare deposit
 const { config: myConfig1 } = usePrepareContractWrite({
                              address: scaddress,
                              abi: WalletMultisig, 
                              functionName: 'deposit',
                              account: walletClient?.account,
                              value: ethers.parseEther(ethToUseForDeposit),
                              onError(error) {
                                console.log('Error', error)
                              }
                              
  });

  const {  write: setDeposit } = useContractWrite(myConfig1);

  useEffect(() =>{ // so that when I delete and the box remains empty, I don't get an error
    if(Number(spotEthToUseForDeposit) > 0){
      setEthToUseForDeposit(spotEthToUseForDeposit);
    }
   },[spotEthToUseForDeposit])
//////////////////////end deposit

//////////////////prepare createwithdraw
 const { config: myConfig2 } = usePrepareContractWrite({
                                address: scaddress,
                                abi: WalletMultisig,
                                functionName: 'createWithdrawTx',
                                args: [addressWithdraw,ethers.parseEther(withdrawBalance)],
                              });
 
 const {  write: prepareWithdraw } = useContractWrite(myConfig2);


 useEffect(() =>{  // so that when I delete and the box remains empty, I don't get an error
  if(Number(spotWithdrawBalance) > 0){
    setBalanceWithdraw(spotWithdrawBalance);
  }
 },[spotWithdrawBalance])


 useEffect(() =>{  // so that when I delete and the box remains empty, I don't get an error
  if(Number(spotAddressWithdraw) > 0){
    setAddressWithdraw(spotAddressWithdraw);
  }
 },[spotAddressWithdraw])
 

 ///////////////read the various withdrawals to confirm
const  {data: totalWithdrawToBeConfirmed }= useContractRead({
  address: scaddress,
  abi: WalletMultisig,
  functionName: 'getWithdrawTxes',
  watch: true ,
  onSuccess(data) {
    console.log(data);
  },
  onError(error) {
    console.log(error);
  }
});


useEffect(() => {
  if (totalWithdrawToBeConfirmed) {
    const temp = totalWithdrawToBeConfirmed;
    if (Array.isArray(temp)) {
      // Creates a copy of the array of withdrawTxes
      const updatedWithdrawTxes = temp.map((withdrawTx, index) => {
        return {
          transactionIndex: index,
          to: withdrawTx.to,
          amount: ethers.formatEther(withdrawTx.amount),
          approvals: String(withdrawTx.approvals),
          sent: withdrawTx.sent,
        };
      });

      // Update the state of the array with the new copy to avoid redundancy
      setWithdrawTxes(updatedWithdrawTxes);
    } else {
      console.log('temp non è un array di struct');
    }
  }
}, [totalWithdrawToBeConfirmed]);
///////////////////////////// and of reading


////////////////Give the opportunity to confirm the various withdrawals

const { config: myConfig3 } = usePrepareContractWrite({
  address: scaddress,
  abi: WalletMultisig,
  functionName: 'approveWithdrawTx',
  args: [Number(indexConfirmTransaction)],
});

// Hook contract functions
const { data: data3, write: confirmWithdraw } = useContractWrite(myConfig3)

useEffect(() =>{  // so that when I delete and the box remains empty, I don't get an error
  if(spotIndexConfirmTransaction !== ""){
    setIndexConfirmTransaction(spotIndexConfirmTransaction);
  }
 },[spotIndexConfirmTransaction])




  return (
    <>
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 12,

      }}
    >
      <ConnectButton />
  
    </div>
    <div style={{padding: 40}}>
     <div className="container flex flex-col items-center mt-10">

     <div className="flex mb-6">        
     </div>
     <br></br>
     <br></br>
      <h3 className = "text=5x1 font-bold mb-20">
       {"deposit to walletMultisig:"}
      </h3>
          
             <Form>
                 <Form.Group className ="mb-3" controlId ="ethUseForDeposit">
                   <Form.Control
                     type="text"
                     placeholder="enter the amount in eth"
                    onChange={(e) => setSpotEthToUseForDeposit(e.target.value)}
                     />
                   <Button variant = "success" onClick={() => setDeposit?.() } 
                   >
                     deposit to Multisig
                   </Button>
                 </Form.Group>
             </Form>
             <br></br>
             <div>Multisig Smart Contract Address: {scaddress}</div>
             <br></br>
             <div>Multisig owners Address: {owners }</div>
             <br></br>
             <div>Multisig totalWithdraw confirmed and unconfirmed: {totalWithdraw}</div>
             <br></br>
             <div>Multisig Smart Contract balance: {scBalance}</div>
             
   </div>
   <div className="container flex flex-col items-center mt-10">

     <div className="flex mb-6">        
     </div>
      <h3 className = "text=5x1 font-bold mb-20">
       {" set parameters to do withdraw"}
      </h3>
      <Form>
         <Form.Group className ="mb-3" controlId ="balanceWithdraw">
            <Form.Control
                 type="text"
                 placeholder="enter the amount in eth"
                 onChange={(e) => setSpotBalanceWithdraw(e.target.value)}
            />
            <br></br>
            <br></br>
            <Form.Control
                 type="text"
                 placeholder="enter address to do withdraw"
                 onChange={(e) => setSpotAddressWithdraw(e.target.value)}
            />
            <Button variant = "primary" onClick={() => prepareWithdraw?.() }>  send parameters </Button>
         </Form.Group>
      </Form>
      <div>
        <h3>Withdraws txes:</h3>
        <ul>
          {withdrawTxes.map((withdrawTx, index) => (
            <li key={index}>
              <div>Transaction Index: {withdrawTx.transactionIndex}</div>
              <div>To: {withdrawTx.to}</div>
              <div>Amount: {withdrawTx.amount}</div>
              <div>Approvals: {withdrawTx.approvals}</div>
              <div>Sent: {withdrawTx.sent ? 'Yes' : 'No'}</div>
            </li>
          ))}
        </ul>
      </div> 
      <Form>
         <Form.Group className ="mb-3" controlId ="indexConfirmation">
            <br></br>
            <h3>digit the index about the transaction that you want confirm:</h3>
            <Form.Control
                 type="text"
                 placeholder="enter index to do a confirm"
                 onChange={(e) => setSpotIndexConfirmTransaction(e.target.value)}
            />
            <Button variant = "primary"  onClick={() => confirmWithdraw?.() }>  send parameters </Button>
         </Form.Group>
      </Form>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
   </div>
   </div>
   </>
  );
};

export default App;
