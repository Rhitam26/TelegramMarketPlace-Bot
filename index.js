const { Telegraf, Extra, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const axios = require('axios')

const bot = new Telegraf("6475693391:AAGfTpE9JgQAMDZDIp3LgUdd2Dqo5Y9c-Uk")
const apiKey ="d9448806eab5eadca4ace89d793be3dd0777e8a43dd8e4a8c606f624ee134f9e"

const { get } = require('http');

var UserData = require('./memory')
// // create an express app
// const express = require('express')
// const app = express()


const {google} = require('googleapis');
const spreadsheet_id ="1dXj97PDpTxPB0zFErA6-CGZdMFRuZsIHpfvpisPCX_c"
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});




async function getBrandList(category){
    // console.log("Inside getBrandList function")
    // console.log("ENVIROPNMNET IS "+process.env.environment)
    let sheetName = category
    const products = await readExcelSheetData(sheetName=sheetName);
    let brand_list = []
    let index =0;
    let response = "";
    // console.log(products[0][0])
    for (let i = 0; i < products.length; i++) {
        let brand = products[i][0].toString().toUpperCase();
        if(brand_list.includes(brand) == false){
            brand_list[index] = brand;
            index++;
        }
    }
    return brand_list;
}

async function askUserBrand(ctx, category){
    let brand_list = []
    if(category == "Combo"){
        brand_list = await getBrandList("Combo");
    }
    else if(category == "Battery"){
        brand_list = await getBrandList("Battery");
        // brand_list = batteryBrands;
    }
    else if(category == "Charging Strip"){
        brand_list = await getBrandList("Charging Strip");
        // brand_list = chargingStripBrands;
    }
    console.log("Inside askUserBrand function")
    // console.log(brand_list);
    let buttons= []
    let lst = []
    let j=1
    for (let i = 0; i < brand_list.length; i++) {
        // console.log("DOING FOR "+brand_list[i])
        lst.push({
        text: brand_list[i],
        callback_data: brand_list[i],
    })
    // console.log("Current value of j is "+j)

    // check if the index is divisible by 3 or if the index is the last element or if the index is the second last element
    if (j%3==0 || brand_list.length-j ==0 || brand_list.length-j ==1 ){
        // console.log("Inside if condition with current value of j as "+j)
        buttons.push(lst)
        // console.log(buttons);
        if(brand_list.length-j ==0){
            console.log("Inside last element with current value of j as "+j)
            lst=[]
            break;
        }
        else if (brand_list.length-j ==1){
            lst=[]
            
            
        }
        else{
            lst=[]
        }
    }
    j++
}
// delete if any duplicates are present in the list of list of dictionaries
    for (let i = 0; i < buttons.length; i++) {
        buttons[i] = buttons[i].filter((item, index) => {
            return buttons[i].indexOf(item) === index
        })
    }

    

    
    await bot.telegram.sendMessage(ctx.chat.id, 'Choose a brand', {
        reply_markup: {
            inline_keyboard: buttons
            }})
    return;

}

async function readExcelSheetData(sheetName) {
    // console.log("Reading from "+sheetName+" sheet")
    try {

        // Process the data further as needed
        const client = await auth.getClient();
        const googleSheets = google.sheets({version: 'v4', auth: client});
        // const metadata = await googleSheets.spreadsheets.get({
        //     auth,
        //     spreadsheetId: spreadsheet_id,
        // });
        // console.log(metadata.data.sheets[0]);
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId: spreadsheet_id,
            range: sheetName});
            const rows = getRows.data.values;
            return rows;


      } catch (error) {
        console.error('Error reading Excel sheet:', error);
      }
    }

async function seacrchCombo(productName, category, brand){
    let product_name= productName.toUpperCase();
    let sheetName = "Combo"
    const products = await readExcelSheetData(sheetName=sheetName);
    console.log("Inside search model")
    // console.log(products);
    let product_list = []
    let index =0;
    let response = "";
    // look up in column name Model if the text contains the product name, if exists return the value in column Price else return Not in Stock
    for (let i = 0; i < products.length; i++) {
        // convert product[i][1] to string and upper case
        let product = products[i][1].toString().toUpperCase();
        let brand_name = products[i][0].toString().toUpperCase();
        if(brand_name.includes(brand.toString().toUpperCase()) && product.includes(product_name) && products[i][7] >= 1){
        // assign the product name and price to a dictionary
        // let product_name = product[i][0].toString+" "+products[i][0].toString()
        // console.log("Product type is : "+products[i][2])
        product_list[index] = {brand:products[i][0],product_name: products[i][1], price: products[i][6], type:products[i][2], fram:products[i][3], quality:products[i][4],pasting:products[i][5]};
        product_list.push(product_list[index]);
        // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_text+"\n"+"\n";
        index++;
        // return products[i][6];
        }
        else if(brand_name.includes(brand.toString().toUpperCase()) && product.includes(productName) && products[i][7] <= 0){
        product_list[index] = {brand:products[i][0],product_name: products[i][1], price: products[i][6], type:products[i][2], fram:products[i][3], quality:products[i][4],pasting:products[i][5]};
        // change price to not in stock
        product_list[index].price = "Not in Stock";
        product_list.push(product_list[index]);
        // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+"\n";
        index++
    }
}
    // get the length of profuct_list
    // console.log(product_list);
    product_list = product_list.filter(function (el) {
        return el != null;
        });
    // console.log(product_list)
    ;
    // remove the last element from the list as its a duplicate
    product_list.pop()
         
    if(product_list.length == 0){
        return "Not in Stock";
        }
    else{
        //sort product_list based on price
        // product_list.sort((a, b) => (a.price > b.price) ? 1 : -1)
        // console.log(product_list);
        // loop through the product_list and append the product name and price to response

        for (let i = 0; i < product_list.length; i++) {
            let extra_text = ""
            console.log()
            if(product_list[i].type != ""){extra_text = extra_text + " "+"("+product_list[i].type+")";}
            if(product_list[i].fram != ""){extra_text = extra_text + " "+"("+product_list[i].fram+")";}
            if(product_list[i].quality != ""){extra_text = extra_text + " "+"("+product_list[i].quality+")";}
            if(product_list[i].pasting != ""){extra_text = extra_text + " "+"("+product_list[i].pasting+")";}
            response = response+product_list[i].brand+" "+product_list[i].product_name+" : Price : "+product_list[i].price+" "+extra_text+"\n"+"\n";
        }
        
        return response;
        
    }
    }
async function seacrchChargingStrip(productName, category){
    let product_name= productName.toUpperCase();
    // console.log("Reading from Charging Strip sheet")
    let sheetName = "Charging Strip"
    let products = await readExcelSheetData(sheetName=sheetName);
    let product_list = []
    let index =0;
    let response = "";
    // look up in column name Model if the text contains the product name, if exists return the value in column Price else return Not in Stock
    for (let i = 0; i < products.length; i++) {
        // convert product[i][1] to string and upper case
        let product = products[i][1].toString().toUpperCase();
        if(product.includes(product_name) && products[i][3] >= 1){
            // assign the product name and price to a dictionary
            console.log("Product name is : "+products[i][1])
            product_list[index] = {product_name: products[i][1], price: products[i][2],type:products[i][0]};
            product_list.push(product_list[index]);
            // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_charging_text+"\n"+"\n";
        }
        else if(product.includes(productName) && products[i][3] <=0){
            // append the dictionary to the list
            product_list[index] = {product_name: products[i][1], price: "Not in Stock"};
            // product_list[index].price ="Not in Stock";
            product_list.push(product_list[index]);
            console.log("Product name is : "+products[i][1])
            // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+'\n'
        }
        index++;
        }
        // console.log(product_list)
        // remove the empty elements from the list
        product_list = product_list.filter(function (el) {
            return el != null;
            });
        // console.log(product_list)
        ;
        // remove the last element from the list as its a duplicate
        product_list.pop()

        if(product_list.length == 0){
            console.log("Not in Stock");
        return "Not in Stock";
        }
        else{
            
        for (let i = 0; i < product_list.length; i++) {
            let extra_charging_text=""
            if(product_list[i].type != undefined)
            {extra_charging_text = extra_charging_text + " "+"("+product_list[i].type+")";}
            response = response+product_list[i].product_name+" : Price "+product_list[i].price+" "+extra_charging_text+"\n"+"\n";

        }
        return response;
        }
    }

async function seacrchBattery(productName, category){
    let product_name= productName.toUpperCase();
    let sheetName = "Battery"
    const products = await readExcelSheetData(sheetName=sheetName);
    console.log("Inside Battery Search Model, looking for "+product_name)
    let product_list = []
    let index =0;
    let response = "";
    for (let i = 0; i < products.length; i++) {
        let product = products[i][1].toString().toUpperCase();
        
        if(product.includes(product_name)&& products[i][3]<=0){
            console.log(product_name)
        product_list[index] = {product_name: products[i][1], price: "Not in Stock", brand: products[i][0]};
        // product_list[index] = {product_name: products[i][1], price: "Not in Stock"};
        // product_list[index].price ="Not in Stock";
        product_list.push(product_list[index]);
        console.log("Product name is : "+products[i][1])
        product_list.push(product_list[index]);        // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_text+"\n"+"\n";
        index++;
        }
        else if(product.includes(productName) && products[i][3] >= 1){
            product_list[index] = {product_name: products[i][1], price: products[i][2], brand: products[i][0]};
            product_list.push(product_list[index]);
            // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+"\n";;
            index++;
        }
    }
    product_list = product_list.filter(function (el) {
        return el != null;
        });
    // console.log(product_list)
    // remove the last element from the list as its a duplicate
    product_list.pop()

    ;
    if(product_list.length == 0){
        return "Not in Stock";
        }
        else{
        for (let i = 0; i < product_list.length; i++) {
            let extra_text = ""
            if(product_list[i].brand != undefined){extra_text = extra_text + " "+"("+product_list[i].brand+")";}
            response = response+product_list[i].product_name+" : Price "+product_list[i].price+" "+extra_text+"\n"+"\n";
        }
        return response;
        }
    }
async function initialChoice(ctx){

    bot.telegram.sendMessage(ctx.chat.id, 'Choose a category', {
        reply_markup: {
            inline_keyboard: [[{text: 'Combo', callback_data: 'Combo'}],[{text: 'Charging Strip', callback_data: 'Charging Strip'}],[{text: 'Battery', callback_data: 'Battery'}]]
            }})
        }
    

bot.use(async(ctx,next)=>{
    console.log("Inside use function")
    console.log(ctx.from)
    // check if text exists in the message
    if(ctx.message != undefined){
        ctx.state.updateType = "message"
    }
    else {
        ctx.state.updateType = "callback_query"
    }

    // console.log("Brand read is : "+UserData.getbrandRead(ctx.from.id))
    // console.log(ctx)

    // check if the user is already in the database 
    
    // console.log("Brand read is : "+ctx.state.branRead)
    if (UserData.getbrandRead(ctx.from.id) == undefined){
    UserData.setBrandRead(ctx.from.id,"true")
    // console.log(UserData.getbrandRead(ctx.from.id))
    let comboBrands =  await getBrandList("Combo");
    // console.log(comboBrands)
    UserData.setComboBrands(key=ctx.from.id,value=comboBrands)
    // console.log(UserData.getComboBrands(ctx.from.id))
    let batteryBrands =  await getBrandList("Battery");
    // console.log("Battery Brands are : "+batteryBrands)
    UserData.setBatteryBrands(key=ctx.from.id,value=batteryBrands)
    // console.log("Battery Brands are : "+UserData.getBatteryBrands(ctx.from.id))
    let chargingStripBrands =  await getBrandList("Charging Strip");
    // console.log("Charging Brands are : "+chargingStripBrands)
    UserData.setChargingStripBrands(key=ctx.from.id,value=chargingStripBrands)
    // console.log("Charging Brands are : "+UserData.getChargingStripBrands(ctx.from.id))
    
}

    if(ctx.state.updateType == 'callback_query'){
        console.log("Inside callback query")
        var chat_id = ctx.from.id
        console.log("Chat id is : "+chat_id)
        // console.log(UserData.getBatteryBrands(chat_id))
        if (ctx.update.callback_query.data == "Combo" || ctx.update.callback_query.data == "Charging Strip" || ctx.update.callback_query.data == "Battery"){
            UserData.setCategory(chat_id,ctx.update.callback_query.data)
            console.log("Category is : "+UserData.getCategory(chat_id))

            await askUserBrand(ctx, ctx.update.callback_query.data)
    }
    // check if the call back data is from the list of brands
    else if (ctx.update.callback_query.data == "Yes"){
        await initialChoice(ctx)
        // console.log("Inside Yes")
        // console.log(ctx.chat.id)
        // let conversation_id = ctx.chat.id
        UserData.setCategory(ctx.chat.id,"None")
    }

    else if (ctx.update.callback_query.data == "No"){
        bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service, I would also take the opputunity to intoduce you to our other services. Select OTHER PRODUCTS to view the same or END CONVERSATION to end', {
            reply_markup: {
                inline_keyboard: [[{text: 'OTHER PRODUCTS', callback_data: 'OTHER PRODUCTS'}],[{text: 'END CONVERSATION', callback_data: 'END CONVERSATION'}]]
                }})
    }

    else if (ctx.update.callback_query.data == "OTHER PRODUCTS"){
        await searchOptherCategories(ctx)
    let conversation_id = ctx.update.message.chat.id
    UserData.setCategory(conversation_id, "None")}
    else if (ctx.update.callback_query.data == "END CONVERSATION"){
        bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service, I would also take the opputunity to intoduce you to our other services. Select OTHER PRODUCTS to view the same or END CONVERSATION to end')}


    else if (UserData.getComboBrands(ctx.from.id).includes(ctx.update.callback_query.data) || (ctx.update.callback_query.data).includes("(100% OG)") || (ctx.update.callback_query.data).includes("TOTAL")){
            UserData.setBrand(chat_id,ctx.update.callback_query.data)
            console.log("Brand is : "+UserData.getBrand(chat_id))
            await ctx.reply("Please enter the model name")
            }

    

}

else if (ctx.state.updateType == "message" && ctx.message.text != "/start" && ctx.message.text != "/category" && ctx.message.text != "/help" && ctx.message.text != "/faq" && ctx.message.text != "/about" && ctx.message.text != "/coin" && ctx.message.text != "/cat" && ctx.message.text != "/menu" && ctx.message.text != "/echo")
{
    console.log("Inside message")
    let conversation_id = ctx.message.chat.id
    // console.log("Category is : "+UserData.getCategory(conversation_id))
    if(UserData.getCategory(conversation_id) == "Combo")
    {
        console.log("Inside Combo************"+ UserData.getCategory(conversation_id))
        let productName = ctx.message.text.toUpperCase();
        console.log("Product Name is : "+productName)

        let response =  await seacrchCombo(productName, category="Combo", brand=UserData.getBrand(conversation_id));
        // console.log("Response is : "+response)
        let forwarded_message = "User : "+ctx.message.from.username+"\n"+"Category :  Combo"+"\n"+"Product : "+productName+"\n"+"Response : "+response;
        await bot.telegram.sendMessage(ctx.chat.id, response);
        bot.telegram.sendMessage(6177576478, forwarded_message);
        searchAnotherProductorEnd(ctx)
        UserData.setCategory(conversation_id, "None")
    }
        
    else if(UserData.getCategory(conversation_id)== "Charging Strip"){

        console.log("Inside Charging Strip************")
        ctx.state.category_chosen = "None"
        let productName = ctx.message.text.toUpperCase();
        let response = await seacrchChargingStrip(productName);
        let forwarded_message = "User : "+ctx.message.from.username+"\n"+"Category :  Charging Strip"+"\n"+"Product : "+productName+"\n"+"Response : "+response;
        await ctx.reply(response);
        bot.telegram.sendMessage(6177576478, forwarded_message);
        // await searchAnotherProductorEnd();
        searchAnotherProductorEnd(ctx)
        UserData.setCategory(conversation_id,"None")
    }
    else if(UserData.getCategory(conversation_id) == "Battery"){
        console.log("Inside Battery************"+ ctx.state.category_chosen)
        ctx.state.category_chosen = "None"
        let productName = ctx.message.text;
        let response = await seacrchBattery(productName, category="Battery");
        let forwarded_message = "User : "+ctx.message.from.username+"\n"+"Category :  Battery"+"\n"+"Product : "+productName+"\n"+"Response : "+response;
        await bot.telegram.sendMessage(ctx.chat.id, response);
        bot.telegram.sendMessage(6177576478, forwarded_message);
        // await searchAnotherProductorEnd();
        searchAnotherProductorEnd(ctx)
        UserData.setCategory(conversation_id, "None")
    }
    else{
        console.log("Inside Normal Message************")
        await ctx.reply("Hello "+ctx.message.from.first_name+"Welcome to Vishal Telecom. I am here to help you with your order. \nPlease type /category to view the categories and the prices.")
    }
    }

    next(ctx)
})

bot.start((ctx)  =>{
    //start
    ctx.reply("You have reached Prime..")
    console.log(ctx.chat.id);

});

async function searchAnotherProductorEnd(ctx){
    await bot.telegram.sendMessage(ctx.chat.id, 'Do you want to search another product?', {
        reply_markup: {
            inline_keyboard: [[{text: 'Yes', callback_data: 'Yes'}],[{text: 'No', callback_data: 'No'}]]
            }})
}

bot.command("category", async(ctx) => {
    console.log("Inside Cartegories");
    const categories = await readExcelSheetData(sheetName='Sheet1');

    bot.telegram.sendMessage(ctx.chat.id, 'Choose a category', {
        reply_markup: {
            inline_keyboard: [[{text: 'Combo', callback_data: 'Combo'}],[{text: 'Charging Strip', callback_data: 'Charging Strip'}],[{text: 'Battery', callback_data: 'Battery'}]]
            }})
    //get the response

    // let response = await seacrchCombo(productName, category="Combo");


});

// bot.action("Yes", async ctx=>{
//     await initialChoice(ctx)
//     console.log("Inside Yes")
//     console.log(ctx.chat.id)
//     // let conversation_id = ctx.chat.id
//     UserData.setCategory(ctx.chat.id,"None")
// }
// )


async function searchOptherCategories(ctx){
    // html markup
    bot.telegram.sendMessage(ctx.chat.id, 'Please click on the below Links to view the products : \n\n\n <a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 1</a> \n\n'+'<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 2</a> \n\n'+'<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 3</a> \n\n'+ '<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 4</a> \n\n' , { parse_mode: 'HTML' }); 
}

// bot.action("No", async ctx=>{
//     bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service, I would also take the opputunity to intoduce you to our other services. Select OTHER PRODUCTS to view the same or END CONVERSATION to end', {
//         reply_markup: {
//             inline_keyboard: [[{text: 'OTHER PRODUCTS', callback_data: 'OTHER PRODUCTS'}],[{text: 'END CONVERSATION', callback_data: 'END CONVERSATION'}]]
//             }})
// })

// bot.action("OTHER PRODUCTS", async ctx=>{
//     await searchOptherCategories(ctx)
//     let conversation_id = ctx.update.message.chat.id
//     UserData.setCategory(conversation_id, "None")
// })

// bot.action("END CONVERSATION", async ctx=>{
//     // end conversation
//     await ctx.reply("Thank you for using our service, we hope to see you again soon")
//     UserData.setCategory(conversation_id, "None")

// });

// let process.env.environment= 
// if(process.env.environment == undefined){
//     bot.launch({
//       webhook:{
//           domain: "https://nwc9xod1wb.execute-api.ap-south-1.amazonaws.com/TelegrAmBotMarketPlace",// Your domain URL (where server code will be deployed)
//           port: process.env.PORT || 8000
//       }
//     }).then(() => {
//       console.info(`The bot ${bot.botInfo.username} is running on server`);
//     });
//   } else { // if local use Long-polling
//     bot.launch().then(() => {
//       console.info(`The bot ${bot.botInfo.username} is running locally`);
//     });
//   }
exports.handler = async (event, conetxt, callback) => {
    console.log("event.body is : "+event.body)
    const temp =JSON.parse(event.body)

    bot.handleUpdate(temp);
    return callback(null, {
        statusCode: 200,
        body: '',
    })
};

// exports.handler = async (event) => {
//     try {
//       const body = JSON.parse(event.body);
//       await bot.handleUpdate(body);
//       return {
//         statusCode: 200,
//         body: JSON.stringify({ message: 'Update processed successfully' }),
//       };
//     } catch (error) {
//       console.error('Error occurred:', error);
//       return {
//         statusCode: 500,
//         body: JSON.stringify({ error: 'Internal Server Error' }),
//       };
//     }
//   };

// bot.launch()

// bot.launch({
//     webhook: {
//       // Public domain for webhook; e.g.: example.com
//       domain: "https://api.telegram.org/bot1959341927:AAEd1IR0H_n3QDmZpd0uGcMJY61nu6ROR0E/setWebhook?url=https://nwc9xod1wb.execute-api.ap-south-1.amazonaws.com",
  
//       // Port to listen on; e.g.: 8080
//       port: 8080,
  
//       // Optional path to listen for.
//       // `bot.secretPathComponent()` will be used by default
//       hookPath: "/TelegrAmBotMarketPlace",
  
//       // Optional secret to be sent back in a header for security.
//       // e.g.: `crypto.randomBytes(64).toString("hex")`
//       secretToken: "randomAlphaNumericString",
//     },
//   });
// bot.telegram.setWebhook('https://api.telegram.org/bot1959341927:AAEd1IR0H_n3QDmZpd0uGcMJY61nu6ROR0E/setWebhook?url=https://nwc9xod1wb.execute-api.ap-south-1.amazonaws.com/TelegrAmBotMarketPlace')
// bot.startWebhook('/TelegrAmBotMarketPlace', null, 8080)

// exports.handler = async (event, context, callback) => {
//     const temp =JSON.parse(event.body);
//     bot.handleUpdate(temp);
//     return callback(null, {
//         statusCode: 200,
//         body: '',
//     })
// }

// import { createServer } from "https";

// createServer(tlsOptions, await bot.createWebhook({ domain: "https://api.telegram.org/bot1959341927:AAEd1IR0H_n3QDmZpd0uGcMJY61nu6ROR0E/setWebhook?url=https://nwc9xod1wb.execute-api.ap-south-1.amazonaws.com" })).listen(8443);


// bot.launch({
//     webhook: {
//       // Public domain for webhook; e.g.: example.com
//       domain: "https://nwc9xod1wb.execute-api.ap-south-1.amazonaws.com",
  
//       // Port to listen on; e.g.: 8080
//       port: 8080,
  
//       // Optional path to listen for.
//       // `bot.secretPathComponent()` will be used by default
//       hookPath: "/TelegrAmBotMarketPlace",
  
//       // Optional secret to be sent back in a header for security.
//       // e.g.: `crypto.randomBytes(64).toString("hex")`
//     },
//   });
async function testfunction(){
    console.log("Hi...")
    let res = "Hello From the other side"
    return res
}



module.exports.handler = (event, context, callback) => {
  try {
    // Parse the event body only if it exists and is not empty
    console.log(event)

    // const body = event.body ? JSON.parse(event.body) : {};

    // Handle the update if it's a Telegram update
    if (event.message || event.callback_query) {
      bot.handleUpdate(event);
    }

    // Respond with a 200 status code
    callback(null, {
      statusCode: 200,
      body: 'Success',
    });
  } catch (error) {
    console.error('Error handling update:', error);
    // Respond with an error status code and error message
    callback(null, {
      statusCode: 500,
      body: 'Error handling the update',
    });
  }
};
// bot.launch()

// exports.handler = async (event) => {
//     let message
//     try {
//       if (!event.body) {
//         throw new Error("unknown request type")
//       }
//       let body = event.body
//       if (event.isBase64Encoded) {
//         body = base64Decode(body)
//       }
//       message = JSON.parse(body)
//     } catch (error) {
//       return {
//         statusCode: 400,
//         body: error.message,
//       }
//     }
//     try {
//     //   const botToken = await getToken() // e.g. get bot token from AWS Secrets Manager
//     //   const bot = new Telegraf(botToken)
//       await bot.handleUpdate(message)
//     } catch (error) {
//       return {
//         statusCode: 500,
//         body: error.message,
//       }
//     }
//   }
  
//   function base64Decode(str) {
//     return Buffer.from(str, "base64").toString("utf8")
//   }







// bot.launch()