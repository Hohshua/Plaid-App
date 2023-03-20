import React from "react";

// import { Chart } from "../../node_modules/react-google-charts";

import Endpoint from "./Endpoint";
import ProductTypesContainer from "./ProductTypes/ProductTypesContainer";
import {
  transformItemData,
  transformAccountsData,
  itemCategories,
  accountsCategories,
  getBalanceData,
} from "../dataUtilities";

import styles from "../App.module.scss"

const Balances = () => (
  <>
    <ProductTypesContainer productType="Balances">
      <Endpoint
        endpoint="accounts"
        schema="/accounts/get"
        categories={accountsCategories}
        description="Retrieve high-level information about all accounts associated with an item."
        transformData={getBalanceData}
      />
    </ProductTypesContainer>
    {/* <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
    <div id="piechart" ></div> */}
  </>
);

const BalanceChart = () => (
    <>
        <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
        <div id="piechart" className={styles.gChart}></div>
    </>
)

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
  return {data};
};

Balances.displayName = "Balances";

export default Balances;
