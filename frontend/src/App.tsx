import React, { useEffect, useContext, useCallback } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Balances from "./Components/Balances";
import BalanceChart from "./Components/Balances";
import Context from "./Context";

import styles from "./App.module.scss";

import getBalance from "./Components/Balances";

import { abort } from "process";

// import drawChart from "./setupProxy.js"

// import google from "../node_modules/react-google-charts"
import {Chart} from "react-google-charts"
import { visitFunctionBody } from "typescript";

let outerValue: string;

// const address = fetch("api/accounts", {
//   method: "GET",
// })
// .then((response) => response.json())
// .then((data) => {
//   console.log(data.accounts[0].balances.available)
//   outerValue = data.accounts[0].balances.available.toString();
//   return data.accounts[0].balances.available;
// });

// const printAddress = async (): Promise<string> => {
//   await address;
//   console.log(outerValue);
//   return outerValue;
// };

// let tempTable: Array<Array<string | number>>;

// async function getValue() {
//   let resolvedValue = await printAddress();
//   tempTable = [    ["Category", "Amount"],
//     [resolvedValue, 11],
//     ["Eat", 2],
//     ["Commute", 2],
//     ["Watch TV", 2],
//     ["Sleep", 7],
//   ];
//   console.log(tempTable);
// }

// getValue();






const TransactionCall = fetch("api/transactions", {
  method: "GET",
})
.then((response) => response.json())
.then((data) => {
  // console.log(data);
  return data.latest_transactions;
});

const getCategories = async () => {
  const transactionData = await TransactionCall;
  const categories = new Set();
  for (let i = 0; i < transactionData.length; i++) {
    categories.add(transactionData[i].category[0]);
  }
  return Array.from(categories);
};

// const createTable = async () => {
//   const transactionData = await TransactionCall;
//   const table = new Map();
//   for (let i = 0; i < transactionData.length; i++) {
//     const category = transactionData[i].category[0];
//     const amount = transactionData[i].amount;
//     console.log(category);
//     console.log(amount);
//     if (table.has(category)) {
//       table.set(category, table.get(category) + amount);
//     } else {
//       table.set(category, amount);
//     }
//   }
//   // console.log(Array.from(table.entries()));
//   return Array.from(table.entries());
// };

let googleTable: Array<Array<string | number>>;
async function createTable() {
  const transactionData = await TransactionCall;
  const table = new Map([["Category", "Amount"]]);
  console.log(Object.keys(transactionData).length);
  for (let i = 0; i < transactionData.length; i++) {
    const category = transactionData[i].category[1];
    let amount = transactionData[i].amount;
    if (amount < 0) {
      amount = -amount;
    }
    if (table.has(category)) {
      table.set(category, table.get(category) + amount);
    } else {
      table.set(category, amount);
    }
  }
  googleTable = Array.from(table.entries());
  console.log(googleTable)
  // console.log(Array.from(table.entries()));
  // return Array.from(table.entries());
}

createTable()







const App = () => {
  const { linkSuccess, isItemAccess, isPaymentInitiation, dispatch } = useContext(Context);

  const getInfo = useCallback(async () => {
    const response = await fetch("/api/info", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { backend: false } });
      return { paymentInitiation: false };
    }
    const data = await response.json();
    const paymentInitiation: boolean = data.products.includes(
      "payment_initiation"
    );
    dispatch({
      type: "SET_STATE",
      state: {
        products: data.products,
        isPaymentInitiation: paymentInitiation,
      },
    });
    return { paymentInitiation };
  }, [dispatch]);

  const generateToken = useCallback(
    async (isPaymentInitiation) => {
      // Link tokens for 'payment_initiation' use a different creation flow in your backend.
      console.log("Step 1: Request a link token from the server");
      const path = isPaymentInitiation
        ? "/api/create_link_token_for_payment"
        : "/api/create_link_token";
      const response = await fetch(path, {
        method: "POST",
      });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
      const data = await response.json();
      if (data) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: {
              linkToken: null,
              linkTokenError: data.error,
            },
          });
          return;
        }
          console.log(
            `Step 2a: Receieved the link token from the server ${JSON.stringify(data)}`
          );
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      // Save the link_token to be used later in the Oauth flow.
      localStorage.setItem("link_token", data.link_token);
    },
    [dispatch]
  );

  useEffect(() => {
    const init = async () => {
      const { paymentInitiation } = await getInfo(); // used to determine which path to take when generating token
      // do not generate a new token for OAuth redirect; instead
      // setLinkToken from localStorage
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }
      generateToken(paymentInitiation);
    };
    init();
  }, [dispatch, generateToken, getInfo]);

  const printBalance = async () => {
    const response = await fetch("api/accounts", {
      method: "GET",
    });
    const data = await response.json();
    console.log(`Here's your data! ${JSON.stringify(data)}`);
    const accounts = data.accounts;
    const balances = accounts[0].balances;
    const available = JSON.stringify(balances.available);
    console.log(`Balance: ${JSON.stringify(balances.available)}`);
    return data;
  };

  const functionB = async () => {
    const value = await printBalance();
    var data = await JSON.stringify(value.accounts[0].balances.available);
    return data;
  };

  const functionC = async () => {
    const meta = await functionB();
    console.log(meta);
    return meta;
  };


  const simpleTransactionCall = async () => {
    // Call our local server
    const response = await fetch("api/transactions", {
      method: "GET",
    });
    const data = await response.json();
    console.log(`Here's your data! ${JSON.stringify(data)}`);

    return data.latest_transactions[0];
  };

  // const jsonTransaction = simpleTransactionCall();
  // const chartData = [
  //   ["Category", "Amount"],
  //   [JSON.stringify(jsonTransaction.latest_transactions[0].account_id[0].category[0]), 11],
  //   ["Eat", 2],
  //   ["Commute", 2],
  //   ["Watch TV", 2],
  //   ["Sleep", 7],
  // ];
  
  // const chartData = [
  //   ["Category", "Amount"],
  //   [`${printAddress()}`, 11],
  //   ["Eat", 2],
  //   ["Commute", 2],
  //   ["Watch TV", 2],
  //   ["Sleep", 7],
  // ];

  const pieOptions = {
    title: "Distribution",
    pieHole: 0.4
  };
  const barOptions = {
    title: "Spending",
    is3D: true,
    legend: { position: "right" },
  };
  
  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <Header />
        {linkSuccess && (
          <>
            {isPaymentInitiation && (
              <Products />
            )}
            {isItemAccess && (
              <>
                <Products />
                <Items />
                <Chart
                    chartType="PieChart"
                    data={googleTable}
                    options={pieOptions}
                    width={"100%"}
                    height={"400px"}
                  />
                <Chart 
                    chartType="BarChart"
                    data={googleTable}
                    options={barOptions}
                    width={"100%"}
                    height={"400px"}
                />
                <button onClick={simpleTransactionCall}>Get transactions!</button>
                <button onClick={printBalance}>Get Balance!</button>
                <Balances />
                {/* <BalanceChart /> */}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};



const GetBalance = async () => {
  const response = await fetch("api/accounts", {
    method: "GET",
  });
  const data = await response.json();
  console.log(`Here's your data! ${JSON.stringify(data)}`);
  const accounts = data.accounts;
  const balances = accounts[0].balances;
  console.log(`Balance: ${JSON.stringify(balances.available)}`);
  const available = JSON.stringify(balances.available);

  return (
    <div>
      <p>Balance: {available}</p>
    </div>
  )
};

// Skip all the fancy React stuff
// const simpleTransactionCall = async () => {
//   // Call our local server
//   const response = await fetch("api/transactions", {
//     method: "GET",
//   });
//   const data = await response.json();
//   console.log(`Here's your data! ${JSON.stringify(data)}`)
// };

export default App;
