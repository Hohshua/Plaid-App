import React, { useEffect, useContext, useCallback } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Balances from "./Components/Balances";
import BalanceChart from "./Components/Balances";
import Context from "./Context";

import styles from "./App.module.scss";

import { abort } from "process";

// import drawChart from "./setupProxy.js"

// import google from "../node_modules/react-google-charts"
import {Chart} from "react-google-charts"


const data2 = [
  ["Category", "Amount"],
  ["Work", 11],
  ["Eat", 2],
  ["Commute", 2],
  ["Watch TV", 2],
  ["Sleep", 7],
];

const options = {
  title: "Distribution",
  pieHole: 0.4
};


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

  const getBalance = async () => {
    const response = await fetch("api/accounts", {
      method: "GET",
    });
    const data = await response.json();
    console.log(`Here's your data! ${JSON.stringify(data)}`);
    const accounts = data.accounts;
    const balances = accounts[0].balances;
    const available = JSON.stringify(balances.available);
    console.log(`Balance: ${JSON.stringify(balances.available)}`);
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
                    data={data2}
                    options={options}
                    width={"100%"}
                    height={"400px"}
                  />
                <button onClick={simpleTransactionCall}>Get transactions!</button>
                <button onClick={getBalance}>Get Balance!</button>
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
const simpleTransactionCall = async () => {
  // Call our local server
  const response = await fetch("api/transactions", {
    method: "GET",
  });
  const data = await response.json();
  console.log(`Here's your data! ${JSON.stringify(data)}`)
};

export default App;
