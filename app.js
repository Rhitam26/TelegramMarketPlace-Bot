const { Telegraf, Extra, Markup } = require('telegraf')
const { message } = require('telegraf/filters');
const axios = require('axios')
const textconts = require('./helper/texts.json')
const fs = require('fs')
const { JSDOM } = require('jsdom');
const xlsx  = require('xlsx')
const list_of_commands =     [
    {
    command: '/start',
    description: 'Starts the bot'
},
{
    command: '/faq',
    description: "Frequently asked questions"
},
{
    command: '/help',
    description: 'Helps you with the bot'
},
{
    command: '/about',
    description: 'About the bot'
},
{
    command: '/cat',
    description: 'Sends a random cat pic'
},
{
    command: '/fortune',
    description: 'Sends a random fortune'
},
{
    command: '/menu',
    description: 'Sends a menu'
},
{
    command: '/coin',
    description: 'Sends a menu'
},{
command:'/category',
description: 'Categories'
}
]
var UserData = require('./memory')

const bot = new Telegraf("1959341927:AAEd1IR0H_n3QDmZpd0uGcMJY61nu6ROR0E")

const helpMessage ='Say something to me  \n /start - start the bot \n /help - command reference \n /echo - echo your text ';

// create a list of all the categories
const categories = ["Combo","Charging Strip","Battery"]


const apiKey ="d9448806eab5eadca4ace89d793be3dd0777e8a43dd8e4a8c606f624ee134f9e"
bot.use(async(ctx,next)=>{
    // check if incoming message is a callback
    console.log(ctx.updateType)
    if (ctx.updateType == "callback_query"){
        var chat_id = ctx.update.callback_query.message.chat.id  
        if (ctx.update.callback_query.data == "Combo" || ctx.update.callback_query.data == "Charging Strip" || ctx.update.callback_query.data == "Battery"){
            UserData.setCategory(chat_id,ctx.update.callback_query.data)
            console.log("Category is : "+UserData.getCategory(chat_id))
            if(ctx.update.callback_query.data == "Combo"){
                await askUserBrand(ctx)
            }
            else{
                ctx.reply("Type in only the model name");
            }
        }
        else if(ctx.update.callback_query.data == "SAMSUNG" || ctx.update.callback_query.data == "OPPO / REALME" || ctx.update.callback_query.data == "REDMI / MI" || ctx.update.callback_query.data == "VIVO" || ctx.update.callback_query.data == "ITELL" || ctx.update.callback_query.data == "HONOR" || ctx.update.callback_query.data == "IPHONE" || ctx.update.callback_query.data == "ONE+"){
            UserData.setBrand(chat_id,ctx.update.callback_query.data)
            console.log("Brand is : "+UserData.getBrand(chat_id))
            ctx.reply("Type in only the model name");
        }

    }

   else if (ctx.updateType == "message" && ctx.update.message.text != "/start" && ctx.update.message.text != "/category" && ctx.update.message.text != "/help" && ctx.update.message.text != "/faq" && ctx.update.message.text != "/about" && ctx.update.message.text != "/coin" && ctx.update.message.text != "/cat" && ctx.update.message.text != "/menu" && ctx.update.message.text != "/echo")
    {
        console.log("Inside message")
        conversation_id = ctx.update.message.chat.id
        console.log("Category is : "+UserData.getCategory(conversation_id))
        if(UserData.getCategory(conversation_id) == "Combo")
        {
            console.log("Inside Combo************"+ UserData.getCategory(conversation_id))
            let productName = ctx.message.text.toUpperCase();
            console.log("Product Name is : "+productName)
            let response =  await seacrchCombo(productName, category="Combo", brand=UserData.getBrand(conversation_id));
            console.log("Response is : "+response)
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
            ctx.reply("Hello "+ctx.message.from.first_name+"! How are you doing?"+'\n'+"I am Betty the bot. I am here to help you with your order. \nPlease type /category to view the categories \n Please type /about to get to know about the services I provide")
        }
        }
        
    next(ctx);
}) 
        
    // call initialChoice function}
    // initialChoice(ctx)

bot.start((ctx)  =>{
    //start
    ctx.reply("You have reached Betty..")
    console.log(ctx.chat.id);
    console.log(ctx.from)
    fs.readFile('./helper/startbody.html', 'utf8', (err, html) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
      
        // Create a DOM object from the HTML string
        const dom = new JSDOM(html);
      
        // Extract the text content from the DOM
        const textContent = dom.window.document.body.textContent;
      
        // Print the extracted text
        console.log(textContent);
      });

      ctx.reply("Hi there! "+ctx.message.from.first_name+" I am Betty the bot and I am here to help you with your order. \nPlease type /category to view the categories \n Please type /about to get to know about the services I provide")
    });
bot.help((ctx)=>{

    ctx.reply(helpMessage)})

bot.hears("Burger",(ctx)=>{
    ctx.reply("Hey there"+String(ctx.from.first_name)+"! How are you doing?")

})


bot.command("echo", (ctx)=>{

    let input = ctx.message.text;
    let inputArray = input.split(" ");
    let message = "";

    if(inputArray.length ==1){
        message = "You said echo"
    }
    else{
        inputArray.shift(); //removes first element in an array 
        message = inputArray.join(" ")
    }
    ctx.reply(message)
})

bot.command("faq",(ctx)=>{
    ctx.reply('1. "What is this service? How does it work? \n \n This is a service to help you get food at a discounted rate! You send us the cart you would like us to order as well as any relevant information (address, phone number). You then pay us a fee and will place the order for you \n\n2. "How do I know I will not get scammed?" \nAll staff are very experienced with thousands of vouches. At request, each individual chef can provide screenshots of past vouches, proving their legitimacy. If you are still skeptical, we will place the order first and THEN you can send us the fee if that makes you feel more whole!\n\n3. "How are you providing this service? Is this carding? \nNo! We do not support any sorts of carding or fraudulent activities here. All food services and other services  here are ran through a combination of ethical m3thods and means. \n\n4. "Are we (the customer) at ANY sort of risk?" \n Nope! As stated, we do not do any carding or anything of that sort. This service is 100% safe for you! \n\n5. "What countries do you guys support?" \nRight now we mainly support USA. However, we made add more countries in the future. \n\n6. "What payments are accepted?" \n It all depends on the chef taking your money. Most chefs take cashapp and zelle. However, some take paypal, crypto, and even apple pay. If you are wondering what payments we take, please just ask! \n\n7. "Im sold! How do I order? \nPlease head on over to @EatsB4UBot and fill out a ticket with all relevant information. A chef will be with you as soon as possible!')
})

bot.action('Swiggy', ctx => {
    ctx.deleteMessage();
    ctx.answerCbQuery();
    bot.telegram.sendAnimation(ctx.chat.id,{source: "helper/giphy.gif"}, {caption: '<b> 30% OFF Swiggy Servicess/b> \n\n Pickup and Delivery! \n\n Order Minum: \n\n Delivery : 20$ SUBTOTAL\n Pickup $30 SUBTOTAL.',parse_mode: 'HTML'})
})

bot.action('Vouchers', ctx => {
    ctx.deleteMessage();
    ctx.answerCbQuery();
    bot.telegram.sendAnimation(ctx.chat.id,{source: "helper/food.gif"}, {caption: '<b> Selling GrubHyb Codes/b> \n\n $10 CODE - $4/per \n\n  $15 CODE - $7/per  \n\n $20 CODE - $10/per',parse_mode: 'HTML'})
});
bot.action('UberEats', ctx => {
    ctx.deleteMessage();
    ctx.answerCbQuery();
    bot.telegram.sendAnimation(ctx.chat.id,{source: "helper/ubereatmix.gif"}, {caption: '<b> 40% OFF Swiggy Servicess/b> \n\n Pickup and Delivery! \n\n Order Minum: \n\n Delivery : 25$ SUBTOTAL\n Pickup $30 SUBTOTAL.',parse_mode: 'HTML'})
});


// ***** These have api call codes ******/

bot.command('fortune', (ctx) =>{

    axios.get('http://yerkee.com/api/fortune').then(res=>{
        ctx.reply(res.data.fortune)
    }).catch(e=>{
        console.log(e)
    })
})

bot.command('cat',(ctx)=>{
    let userRes = ctx.message.text
    let ResArr = userRes.split(" ")
    if (ResArr.length == 1){
        try {
            axios.get("https://aws.random.cat/meow"). then(res=>{
        ctx.replyWithPhoto(res.data.file)})
        } catch (error) {
            console.log(error)
        }
    }

    else{
        ResArr.shift()
        userRes= ResArr.join(" ")
        try {
            ctx.replyWithPhoto("https://cataas.com/cat/says/"+userRes) // since the end point is a photo file
        } catch (error) {
            console.log(error)
                         }
    }})

bot.command('menu', (ctx) => {
    bot.telegram.sendMessage(ctx.chat.id, 'Whats in your Mind..',
        {
            reply_markup: {
                inline_keyboard: [[{ text: 'Burger', callback_data: 'burger' }, { text: 'Pizza', callback_data: 'pizza' }],[{ text: 'Pasta', callback_data: 'pasta'}]
             ]
            }
        }
    )
}
)

bot.command('about', (ctx) => {
    ctx.reply(textconts.about)
});
// bot.action('burger', ctx=>{
//     ctx.deleteMessage();
//     ctx.answerCbQuery();
//     ctx.reply("What burger would you like",{
//         reply_markup:{
//             inline_keyboard:[[{text: "Turky Burger", callback_data:"turkey"},{text:"Portobello Mushroom Burger", callback_data: "portobello"},{text: "Veggie Burger", callback_data:"veggie"}],[{text:"Wild Salmon Burger", callback_data:"wild salmon"},{text:"Bean Burger",callback_data:"bean"},{text:"Chesseburger",callback_data:"cheese"}],[{text:"Go To Menu", callback_data:"menu"}]]
//         }
//     })
// })

bot.action('menu',ctx=>{
    ctx.deleteMessage();
    ctx.answerCbQuery();
    bot.telegram.sendMessage(ctx.chat.id, 'Whats in your Mind..',
    {
        reply_markup: {
            inline_keyboard: [[{ text: 'Burger', callback_data: 'burger' }, { text: 'Pizza', callback_data: 'pizza' }],[{ text: 'Pasta', callback_data: 'pasta'}]
         ]
        }
    }
)
})

bot.command("coin", async ctx=>{
    bot.telegram.sendMessage(ctx.chat.id, "Choose \n - Crypto Price to know prices of specific coins \n- Coin Market Cap to open the site",{
        reply_markup:{
            inline_keyboard:[
                [{text: "Crypto Price", callback_data:"price"}],
                [{text: "Coin Market Cap", url : 'https://coinmarketcap.com/'}]
            ]
        }
    })
})
bot.action("price", ctx=>{
    let priceMessage = 'Get price Information. Select one of the currencies below';
    ctx.deleteMessage();
    console.log("Inside Price")
     bot.telegram.sendMessage(ctx.chat.id, priceMessage,{
        reply_markup:{
            inline_keyboard:[
                [{text: 'BTC',callback_data:'btc'},{text:'ETH', callback_data:'eth'}],
                [{text: 'MATIC',callback_data:'matic'},{text:'SOL', callback_data:'sol'}],
                [{text:'GO BACK', callback_data:'coinChoice1'}]

            ]
        }
    })
    console.log("Moving out of Price")
})

bot.action("coinChoice1", ctx=>{
    let priceMessage = "Choose \n - Crypto Price to know prices of specific coins \n- Coin Market Cap to open the site";
    ctx.deleteMessage();
    bot.telegram.sendMessage(ctx.chat.id, priceMessage,{
        reply_markup:{
            inline_keyboard:[
                [{text: "Crypto Price", callback_data:"price"}],
                [{text: "Coin Market Cap", url : 'https://coinmarketcap.com/'}]
            ]
        }
    })
})

let symbols = ['btc','eth','matic','sol']
bot.action(symbols, async ctx=>{
    // let priceMessage = "Choose \n - Crypto Price to know prices of specific coins \n- Coin Market Cap to open the site";
    // ctx.deleteMessage();
    let symbol = ctx.match.toString().toUpperCase().trim();
    // console.log(ctx.match)
    try {
        ctx.deleteMessage();
        console.log("https://min-api.cryptocompare.com/data/pricemultifull?fsyms="+symbol+"&tsyms=USD,EUR")
        let res = await axios.get("https://min-api.cryptocompare.com/data/pricemultifull?fsyms="+symbol+"&tsyms=USD,EUR"+"? or &api_key="+apiKey)
        console.log(symbol)
        console.log(JSON.stringify(res.data.DISPLAY[symbol].USD))
        let data = res.data.DISPLAY[symbol].USD
        let reply ="Symbol : "+symbol+"\n"+"Price : "+data.PRICE+"\n"+"Open : "+data.OPENDAY+"\n"+"High : "+data.HIGHDAY+"Low : "+data.LOWDAY+"\n"+"Supply : "+data.SUPPLY+"\n"+"Market Cap : "+data.MKTCAP
        bot.telegram.sendMessage(ctx.chat.id,reply)
    } catch (error) {
        console.log(error)
    }
})


bot.command("mobile_screens", (ctx) => {
    ctx.deleteMessage();
 
    // read excel file Sheet2
    const workbook = xlsx.readFile('./helper/price_data.xlsx');  // Step 2
    let workbook_sheet = workbook.SheetNames;                // Step 3
    let workbook_response = xlsx.utils.sheet_to_json(        // Step 4
        workbook.Sheets[workbook_sheet[1]]
    );
    let workbook_data = [];
    for (let i = 0; i < workbook_response.length; i++) {
        // console.log(workbook_response[i].Brands);
        workbook_data.push(workbook_response[i].Brands);
    }
    let buttons= []
    let lst = []
    j=1
    for (let i = 0; i < workbook_data.length; i++) {
        lst.push({
            text: workbook_data[i],
            callback_data: workbook_data[i],
        })
        // check if the index is divisible by 3 or if the index is the last element or if the index is the second last element
        if (j%3==0 || i==workbook_data.length-1 || i==workbook_data.length-2){
            buttons.push(lst)
            if(i==workbook_data.length-1 || i==workbook_data.length-2){
            }
            lst=[]
        }
        j++
    }
    console.log(buttons);
    // keep the unique values of text in buttons
    

    ctx.reply("Choose your Brand",{
        reply_markup:{
            inline_keyboard:buttons
        }})
    });

async function initialChoice(ctx){

    bot.telegram.sendMessage(ctx.chat.id, 'Choose a category', {
        reply_markup: {
            inline_keyboard: [[{text: 'Combo', callback_data: 'Combo'}],[{text: 'Charging Strip', callback_data: 'Charging Strip'}],[{text: 'Battery', callback_data: 'Battery'}]]
            }})
        }
    
async function askUserBrand(ctx){
    bot.telegram.sendMessage(ctx.chat.id, 'Choose a Brand', {
        reply_markup: {
            inline_keyboard: [
                [{text: 'OPPO / REALME', callback_data: 'OPPO / REALME'},{text: 'IPHONE', callback_data: 'IPHONE'}],
                [{text: 'REDMI / MI', callback_data: 'REDMI / MI'},{text: 'SAMSUNG', callback_data: 'SAMSUNG'}],
                [{text: 'VIVO', callback_data: 'VIVO'},{text: 'ONE PLUS', callback_data: 'ONE+'}],
                [{text: 'ITELL', callback_data: 'ITELL'},{text: 'HONOR', callback_data: 'HONOR'}]]
            }})
        }       
    

bot.command("category", async(ctx) => {
    console.log("Inside Cartegories");
    const categories = await readExcelSheetData(bucketName, fileName,sheetName='Sheet1');
    console.log(categories);
    // response =await initialChoice(ctx);
    bot.telegram.sendMessage(ctx.chat.id, 'Choose a category', {
        reply_markup: {
            inline_keyboard: [[{text: 'Combo', callback_data: 'Combo'}],[{text: 'Charging Strip', callback_data: 'Charging Strip'}],[{text: 'Battery', callback_data: 'Battery'}]]
            }})
    //get the response

    // let response = await seacrchCombo(productName, category="Combo");


});


const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const bucketName = 's3.rdeb.buck.001';
const fileName = 'Docs/price_data.xlsx';



AWS.config.update({
    accessKeyId: 'AKIARRH2F7EH5JVCJBKN',
    secretAccessKey: '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',
    region: 'ap-south-1'
  });

const s3 = new AWS.S3();


async function readExcelSheetData(bucketName, fileName, sheetName) {
    console.log("Reading from "+sheetName+" sheet")
    const params = {
      Bucket: bucketName,
      Key: fileName
    };
    try {
        let s3Object = await s3.getObject(params).promise();
        let workbook = XLSX.read(s3Object.Body, { type: 'buffer' });
        let worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // console.log(jsonData);
        return jsonData;
        // Process the data further as needed
      } catch (error) {
        console.error('Error reading Excel sheet:', error);
      }
    }

async function seacrchChargingStrip(productName, category){
    let product_name= productName.toUpperCase();
    console.log("Reading from Charging Strip sheet")
    let sheetName = "Charging Strip"
    let products = await readExcelSheetData(bucketName, fileName,sheetName=sheetName);
    let product_list = []
    let index =0;
    let response = "";
    // look up in column name Model if the text contains the product name, if exists return the value in column Price else return Not in Stock
    for (let i = 0; i < products.length; i++) {
        // convert product[i][1] to string and upper case
        let product = products[i][0].toString().toUpperCase();
        if(product.includes(product_name) && products[i][2] != undefined){
            // assign the product name and price to a dictionary
            console.log("Product name is : "+products[i][0])
            product_list[index] = {product_name: products[i][0], price: products[i][2],type:products[i][1]};
            product_list.push(product_list[index]);
            // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_charging_text+"\n"+"\n";
        }
        else if(product.includes(productName) && products[i][2] == undefined){
            // append the dictionary to the list
            product_list[index].price ="Not in Stock";
            product_list.push(product_list[index]);
            conxsxsole.log("Product name is : "+products[i][0])
            // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+'\n'
        }
        index++;
        }
        // console.log(product_list)
        // remove the empty elements from the list
        product_list = product_list.filter(function (el) {
            return el != null;
            });
        console.log(product_list)
        ;

        if(product_list.length == 0){
            console.log("Not in Stock");
        return "Not in Stock";
        }
        else{
            
        for (let i = 0; i < product_list.length; i++) {
            extra_charging_text=""
            if(product_list[i].type != undefined)
            {extra_charging_text = extra_charging_text + " "+"("+product_list[i].type+")";}
            response = response+product_list[i].product_name+" : Price "+product_list[i].price+" "+extra_charging_text+"\n"+"\n";

        }
        return response;
        }
    }
    
async function seacrchCombo(productName, category, brand){
    let product_name= productName.toUpperCase();
    let sheetName = "Combo"
    const products = await readExcelSheetData(bucketName, fileName,sheetName=sheetName);
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
      if(brand_name.includes(brand.toString().toUpperCase()) && product.includes(product_name) && products[i][6] != undefined){
        // assign the product name and price to a dictionary
        // let product_name = product[i][0].toString+" "+products[i][0].toString()
        product_list[index] = {brand:products[i][0],product_name: products[i][1], price: products[i][6], type:products[i][2], fram:products[i][3], quality:products[i][4],pasting:products[i][5]};
        product_list.push(product_list[index]);
        // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_text+"\n"+"\n";
        index++;
        // return products[i][6];
      }
      else if(brand_name.includes(brand.toString().toUpperCase()) && product.includes(productName) && products[i][6] == undefined){
        product_list[index] = {brand:products[i][0],product_name: products[i][1], price: products[i][6], type:products[i][2], fram:products[i][3], quality:products[i][4],pasting:products[i][5]};
        // change price to not in stock
        product_list[index].price = "Not in Stock";
        product_list.push(product_list[index]);
        // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+"\n";
        index++
    }
}
    // get the length of profuct_list
    console.log(product_list);
    product_list = product_list.filter(function (el) {
        return el != null;
        });
    console.log(product_list)
    ;

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
            if(product_list[i].type != undefined){extra_text = extra_text + " "+"("+product_list[i].type+")";}
            if(product_list[i].fram != undefined){extra_text = extra_text + " "+"("+product_list[i].fram+")";}
            if(product_list[i].quality != undefined){extra_text = extra_text + " "+"("+product_list[i].quality+")";}
            if(product_list[i].pasting != undefined){extra_text = extra_text + " "+"("+product_list[i].pasting+")";}
            response = response+product_list[i].brand+" "+product_list[i].product_name+" : Price : "+product_list[i].price+" "+extra_text+"\n"+"\n";
        }
        
        return response;
        
    }
    }
async function seacrchBattery(productName, category){
    let product_name= productName.toUpperCase();
    let sheetName = "Battery "
    const products = await readExcelSheetData(bucketName, fileName,sheetName=sheetName);
    console.log("Inside Battery Search Model, looking for "+product_name)
    let product_list = []
    let index =0;
    let response = "";
    for (let i = 0; i < products.length; i++) {
        let product = products[i][0].toString().toUpperCase();
        console.log(product)
      if(product.includes(product_name)){
        product_list[index] = {product_name: products[i][0], price: products[i][2], brand: products[i][1]};
        if(products[i][1] != undefined)

        product_list.push(product_list[index]);
        // response = response+product_list[index].product_name+" : Price "+product_list[index].price+" "+extra_text+"\n"+"\n";
        index++;
      }
        else if(product.includes(productName) && products[i][2] == undefined){
            product_list[index] = {product_name: products[i][0], price: products[i][2], brand: products[i][1]};
            product_list.push(product_list[index]);
            // response = response+product_list[index].product_name+" : Not in Stock "+"\n"+"\n";;
            index++;
        }
    }
    product_list = product_list.filter(function (el) {
        return el != null;
        });
    console.log(product_list)
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


async function searchAnotherProductorEnd(ctx){
    await bot.telegram.sendMessage(ctx.chat.id, 'Do you want to search another product?', {
        reply_markup: {
            inline_keyboard: [[{text: 'Yes', callback_data: 'Yes'}],[{text: 'No', callback_data: 'No'}]]
            }})
}

bot.action("Yes", async ctx=>{
    await initialChoice(ctx)
    UserData.setCategory(conversation_id,"None")
}
)


async function searchOptherCategories(ctx){
    // html markup
    bot.telegram.sendMessage(ctx.chat.id, 'Please click on the below Links to view the products : \n\n\n <a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 1</a> \n\n'+'<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 2</a> \n\n'+'<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 3</a> \n\n'+ '<a href="https://drive.google.com/file/d/1wGEyBDT7KrJ7G0AXEtZEM3QYPO0EUpmN/view">Category 4</a> \n\n' , { parse_mode: 'HTML' }); 
}

bot.action("No", async ctx=>{
    bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service, I would also take the opputunity to intoduce you to our other services. Select OTHER PRODUCTS to view the same or END CONVERSATION to end', {
        reply_markup: {
            inline_keyboard: [[{text: 'OTHER PRODUCTS', callback_data: 'OTHER PRODUCTS'}],[{text: 'END CONVERSATION', callback_data: 'END CONVERSATION'}]]
            }})
})

bot.action("OTHER PRODUCTS", async ctx=>{
    await searchOptherCategories(ctx)
    UserData.setCategory(conversation_id, "None")
})

bot.action("END CONVERSATION", async ctx=>{
    // end conversation
    await ctx.reply("Thank you for using our service, we hope to see you again soon")
    UserData.setCategory(conversation_id, "None")

});



bot.launch()

bot.catch((err,ctx)=>{ 
    console.log("Ooops, encountered an error for ${ctx.updateType}", err)
});


bot.telegram.setMyCommands(
    [
    {
    command: '/start',
    description: 'Starts the bot'
},
{
    command: '/faq',
    description: "Frequently asked questions"
},
{
    command: '/help',
    description: 'Helps you with the bot'
},
{
    command: '/about',
    description: 'About the bot'
},
{
    command: '/cat',
    description: 'Sends a random cat pic'
},
{
    command: '/fortune',
    description: 'Sends a random fortune'
},
{
    command: '/menu',
    description: 'Sends a menu'
},
{
    command: '/coin',
    description: 'Sends a menu'
},{
command:'/category',
description: 'Categories'
}
], scope= 'all_chats');