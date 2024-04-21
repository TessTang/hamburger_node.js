const express = require('express');
const router = express.Router();
const axios = require('axios');
const Base64 = require('crypto-js/enc-base64');
require('dotenv').config();
const { LINE_PAY_CHANNELID, LINE_PAY_SECRET, LINE_PAY_VERSION,
  LINE_PAY_SITE, LINE_PAY_RETURN_HOST, LINE_PAY_RETURN_CONFIRM_URL,
  LINE_PAY_RETURN_CANCEL_URL } = process.env;

const sampleData = require('../order');
const { HmacSHA256 } = require('crypto-js');
const orders = {}

const cors = require('cors')
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200
}

router.use(cors())


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
})
// .get('/checkout/:id', function(req, res) {
//   console.log(req.params)
//   const {id} = req.params;
//   const order = sampleData[id];
//   //實務上應該要用伺服器產生ID 這邊只是因為範例
//   order.orderId = parseInt(new Date().getTime() / 1000);
//   orders[order.orderId] = order;
//   // res.render('checkout', { order });
//   res.json(sampleData[id])
// });

//跟LINEPAY串接的API
router
  .post('/createOrder/:orderId', async (req, res) => {
    console.log(req.body);

    // res.json('收到')
    // const {orderId} = req.params;
    // const order = orders[orderId];
    // console.log('create',order);

    try {
      const linePayBody = req.body;
      const uri = '/payments/request';
      const headers = createSignature(uri, linePayBody);

      //   const linePayBody = {
      //     ...order,
      //     redirectUrls:{
      //       // confirmUrl:`${LINE_PAY_RETURN_HOST}${LINE_PAY_RETURN_CONFIRM_URL}`,
      //       confirmUrl:`http://localhost:3000/`,
      //       cancelUrl:`${LINE_PAY_RETURN_HOST}${LINE_PAY_RETURN_CANCEL_URL}`
      //     }
      //   }
      //   const uri = '/payments/request';
      //   const  headers = createSignature(uri, linePayBody);


      //   //將資料與簽章送給linepay
      const url = `${LINE_PAY_SITE}/${LINE_PAY_VERSION}${uri}`;
      const linePayRes = await axios.post(url, linePayBody, { headers });
      res.json(linePayRes?.data)
      //   res.redirect('http://localhost:2407/');
      // //   //若成功就轉址 有分web跟app
      //   if(linePayRes?.data?.returnCode === '0000'){
      //     res.redirect(linePayRes?.data?.info.paymentUrl.web)
      //   }

      //   console.log(linePayRes)

    } catch (error) {
      console.log('error', error)
      res.end();
    }

  })

  //若成功付款，轉回
  .post('/linePay/confirm', async (req, res) => {
    const { transactionId, orderId, amount } = req.body;
    console.log(transactionId, orderId, amount);
    // res.json('收到',transactionId, orderId)
    try {
      const linePayBody = {
        amount: amount,
        currency: 'TWD'
      }

      const uri = `/payments/${transactionId}/confirm`;
      const headers = createSignature(uri, linePayBody);
      const url = `${LINE_PAY_SITE}/${LINE_PAY_VERSION}${uri}`;
      const linePayRes = await axios.post(url, linePayBody, { headers })
      console.log(linePayRes)
      res.json(linePayRes.data)

    } catch (error) {
      res.end()
    }

    // try {
    //   const order = orders[orderId];

    //   const linePayBody = {
    //     amount: order.amount,
    //     currency: 'TWD'
    //   }

    //   const uri = `/payments/${transactionId}/confirm`;
    //   const headers = createSignature(uri, linePayBody);
    //   const url = `${LINE_PAY_SITE}/${LINE_PAY_VERSION}${uri}`;
    //  const linePayRes = await axios.post(url,linePayBody,{headers})
    // console.log(linePayRes)


    // } catch (error) {
    //   res.end()
    // }

  })

function createSignature(uri, linePayBody) {
  const nonce = parseInt(new Date().getTime() / 1000);
  const string = `${LINE_PAY_SECRET}/${LINE_PAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`;
  const signature = Base64.stringify(HmacSHA256(string, LINE_PAY_SECRET));

  //送給linepay的header
  const headers = {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': LINE_PAY_CHANNELID,
    'X-LINE-Authorization-Nonce': nonce,
    'X-LINE-Authorization': signature
  };
  return headers;
}
module.exports = router;


