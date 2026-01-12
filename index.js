import { Telegraf } from 'telegraf';
import axios from 'axios';
import UserData from './memory.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brandAllias = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'allias.json'), 'utf8')
);
import { google } from 'googleapis';

const bot = new Telegraf("6475693391:AAGESWjxdJ2ciP52I5le2wu_a9yF8vGODuw");
const apiKey = "d9448806eab5eadca4ace89d793be3dd0777e8a43dd8e4a8c606f624ee134f9e";
const spreadsheet_id = "1WIe4Xv-WU7BG9-KXWLDsPqAEhRDSmIuu_m7KEg9qlb0";
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});

async function AddZero(num) {
    return (num >= 0 && num < 10) ? "0" + num : num + "";
}

async function logQueries(phone_number, txt) {
    var now = new Date();
    var current_time = [[await AddZero(now.getDate()), 
        await AddZero(now.getMonth() + 1), 
        now.getFullYear()].join("/"), 
        [await AddZero(now.getHours()), 
        await AddZero(now.getMinutes())].join(":"), 
        now.getHours() >= 12 ? "PM" : "AM"].join(" ");

    console.log("Current time is : " + current_time);
    console.log("Inside logQueries function");
    let entries = await readExcelSheetData("Logs");
    let row_number = entries.length + 1;
    console.log("Row number is : " + row_number);
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        googleSheets.spreadsheets.values.update({
            auth,
            spreadsheetId: spreadsheet_id,
            range: `Logs!A${row_number}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[current_time, phone_number, txt]]
            }
        });
    } catch (err) {
        console.log(err);
    }
}

async function forwardRequestToAdmin(chat_id, phone_number) {
    let admin_chat_id = 5887384108;
    bot.telegram.sendMessage(admin_chat_id, 'A request has been raised by ' + phone_number, {
        reply_markup: {
            inline_keyboard: [[{ text: 'Accept', callback_data: 'Accept_' + chat_id + "_" + phone_number }], [{ text: 'Reject', callback_data: 'Reject_' + chat_id + "_" + phone_number }]]
        }
    });
}

async function getUserPhone(chat_id) {
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId: spreadsheet_id,
        range: 'Users',
    });
    const rows = getRows.data.values;
    let phone_number = 0;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i][1] == chat_id) {
            phone_number = rows[i][0];
        }
    }
    return phone_number;
}

async function checkUserLogin(chat_id) {
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId: spreadsheet_id,
        range: 'Users',
    });
    const rows = getRows.data.values;
    let userExists = false;
    console.log("CHAT ID IS : " + chat_id);

    for (let i = 0; i < rows.length; i++) {
        if (parseInt(rows[i][1]) === parseInt(chat_id)) {
            userExists = true;
        }
    }
    if (userExists) {
        UserData.setUserStatus(chat_id, "REGISTERED");
    } else if (UserData.getUserStatus(chat_id) == undefined) {
        UserData.setUserStatus(chat_id, "NOT_REGISTERED");
    }
    return userExists;
}

async function registerUser(chat_id) {
    UserData.setUserStatus(chat_id, "WAITING_FOR_PHONE_NUMBER");
    UserData.getUserStatus(chat_id);
    bot.telegram.sendMessage(chat_id, "Please enter your phone number");
}

async function enterUserDetails(phone_number, chat_id, row_number) {
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client });
    googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId: spreadsheet_id,
        range: `Users!A${row_number}`,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[phone_number, chat_id]]
        }
    });
    UserData.setUserStatus(chat_id, "REGISTERED");
}

async function getBrandList(sheet) {
    let products = await readExcelSheetData(sheet);
    let product_length = products.length;
    console.log("Product length is : " + product_length);

    let brand_list = [];
    for (let i = 0; i < products.length; i++) {
        if (!brand_list.includes(products[i][0])) {
            brand_list.push(products[i][0]);
        }
    }
    return brand_list;
}

async function getAlliasList() {
    console.log(" GET ALLIAS LIST FUNCTION HAS STARTED ");
    let brand_list = [];
    for (let key in brandAllias) {
        let lst = brandAllias[key];
        brand_list = brand_list.concat(lst);
    }
    console.log(brand_list);
    return brand_list;
}

async function askUserBrand(ctx, category) {
    let brand_list = [];
    if (category == "Combo") {
        console.log("Will look up for Combo Brands");
        brand_list = await getBrandList("Combo");
    } else if (category == "Battery") {
        brand_list = await getBrandList("Battery");
    } else if (category == "Charging Strip") {
        brand_list = await getBrandList("Charging Strip");
    }
    console.log("Inside askUserBrand function");
    let buttons = [];
    let lst = [];
    let j = 1;
    for (let i = 0; i < brand_list.length; i++) {
        lst.push({
            text: brand_list[i].toString().toUpperCase(),
            callback_data: brand_list[i],
        });

        if (j % 3 == 0 || brand_list.length - j == 0 || brand_list.length - j == 1) {
            buttons.push(lst);
            if (brand_list.length - j == 0) {
                console.log("Inside last element with current value of j as " + j);
                lst = [];
                break;
            } else if (brand_list.length - j == 1) {
                lst = [];
            } else {
                lst = [];
            }
        }
        j++;
    }
    for (let i = 0; i < buttons.length; i++) {
        buttons[i] = buttons[i].filter((item, index) => {
            return buttons[i].indexOf(item) === index;
        });
    }

    UserData.setCategory(ctx.chat.id, "Combo");
    console.log("Category is : " + UserData.getCategory(ctx.chat.id));

    await bot.telegram.sendMessage(ctx.chat.id, 'Choose a brand', {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
    return;
}

async function readExcelSheetData(sheetName) {
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId: spreadsheet_id,
            range: sheetName
        });
        const rows = getRows.data.values;
        return rows;
    } catch (error) {
        console.error('Error reading Excel sheet:', error);
    }
}

async function returnEntireSheet(brand) {
    console.log("Inside returnEntireSheet function for brand : " + brand);
    let sheetName = "Combo";
    const products = await readExcelSheetData(sheetName = sheetName);
    console.log("Length of products is : " + products.length);
    console.log("First element of products is : " + products[0][0]);

    let product_json = {};
    let index = 0;
    let response = "";
    let len_prd_lst = products.length;
    console.log("Length of product list is : " + len_prd_lst);

    for (let i = 0; i < len_prd_lst; i++) {
        let prd = products[i][1].toString().toUpperCase();
        prd = prd.replace(/\s/g, '');
        if (brand.toString().toUpperCase() == products[i][0].toString().toUpperCase() && parseInt(products[i][5]) >= 1) {
            console.log("Brand is : " + brand);
            console.log("Sheet Brand name is : " + products[i][0]);
            var type = products[i][2];
            if (type.length == 0) { type = ""; }
            var fram = products[i][3];
            if (fram.length == 0) { fram = ""; }
            var products_lst = products[i][1].split("/");

            for (let j = 0; j < products_lst.length; j++) {
                products_lst[j] = products_lst[j].trim();
                var first_alphabet = products_lst[j].charAt(0);
                if (first_alphabet in product_json) {
                    product_json[first_alphabet].push(products_lst[j] + " " + type + " " + fram + " " + "Price : " + products[i][4]);
                } else {
                    product_json[first_alphabet] = [products_lst[j] + " " + type + " " + fram + " " + "Price : " + products[i][4]];
                }
            }
        }
    }

    let sorted_product_json = {};
    let keys = Object.keys(product_json).sort();
    for (let i = 0; i < keys.length; i++) {
        sorted_product_json[keys[i]] = product_json[keys[i]];
    }
    console.log(sorted_product_json);

    return sorted_product_json;
}

async function seacrchCombo(productName, brand) {
    let product_name = productName.toUpperCase().trim();
    console.log("123 Product name is : " + product_name);
    if (product_name.includes("PLUS")) {
        product_name = product_name.replace("PLUS", "+");
    }
    if (product_name.includes("(5G)")) {
        product_name = product_name.replace("(5G)", "5G");
    }
    if (product_name.includes("(4G)")) {
        product_name = product_name.replace("(4G)", "4G");
    }
    if (product_name.includes("5G")) {
        product_name = product_name.replace("5G", "");
    }
    if (product_name.includes("4G")) {
        product_name = product_name.replace("4G", "");
    }

    let sheetName = "Combo";
    const products = await readExcelSheetData(sheetName = sheetName);
    console.log("Inside search model, searching for " + brand + " " + product_name + " in " + sheetName + " sheet");

    let product_list = [];
    let response = "";

    if (brand == undefined) {
        console.log("Brand is undefined ...");
        brand = "";
        let index = 0;
        for (let i = 0; i < products.length; i++) {
            let prd = products[i][1].toString().toUpperCase();
            prd = prd.replace(/\s/g, '');
            prd = prd.replace("PLUS", "+");
            prd = prd.replace("(5G)", "5G");
            prd = prd.replace("(4G)", "4G");

            if (prd.includes(product_name) && parseInt(products[i][5]) >= 1) {
                console.log("Row number is : " + i);
                console.log("Product name is : " + products[i][1]);
                var type = products[i][2];
                console.log("Type is : " + type);
                if (type.length == 0) { type = ""; }
                var fram = products[i][3];
                console.log("Fram is : " + fram);
                if (fram.length == 0) { fram = ""; }

                product_list[index] = {
                    "brand": products[i][0],
                    "product_name": products[i][1],
                    "price": products[i][4],
                    "type": type,
                    "fram": fram
                };

                product_list.push(product_list[index]);
                index++;
            }
        }
        console.log("Product list is : " + product_list);
        for (let i = 0; i < product_list.length; i++) {
            console.log(product_list[i].brand + " " + product_list[i].product_name + " : Price : " + product_list[i].price + " " + product_list[i].type + " " + product_list[i].fram);
        }
    } else {
        console.log("Inside else block");
        let index = 0;
        console.log("Brand is : " + brand);
        console.log("Product name is : " + product_name);
        for (let i = 0; i < products.length; i++) {
            let prd = products[i][1].toString().toUpperCase();
            prd = prd.replace(/\s/g, '');
            prd = prd.replace(/\s/g, '');
            prd = prd.replace("PLUS", "+");
            prd = prd.replace("(5G)", "5G");
            prd = prd.replace("(4G)", "4G");

            if (brand.toString().toUpperCase() == products[i][0].toString().toUpperCase() && prd.includes(product_name) && parseInt(products[i][5]) >= 1) {
                var type = products[i][2];
                if (type.length == 0) { type = undefined; }
                var fram = products[i][3];
                if (fram.length == 0) { fram = undefined; }
                product_list[index] = {
                    "brand": products[i][0],
                    "product_name": products[i][1],
                    "price": products[i][4],
                    "type": type,
                    "fram": fram
                };
            }
            product_list.push(product_list[index]);
            index++;
        }
    }
    
    product_list = product_list.filter(function (el) {
        return el != null;
    });
    console.log(product_list);
    
    product_list = product_list.filter((thing, index, self) =>
        index === self.findIndex((t) => (
            t.product_name === thing.product_name && t.price === thing.price && t.type === thing.type && t.fram === thing.fram
        ))
    );

    if (product_list.length == 0) {
        return "Not in Stock";
    } else {
        for (let i = 0; i < product_list.length; i++) {
            let extra_text = "";
            if (product_list[i].type != undefined) { extra_text = extra_text + " " + "" + product_list[i].type + ""; }
            if (product_list[i].fram != undefined) { extra_text = extra_text + " " + "" + product_list[i].fram + ""; }
            response = response + product_list[i].brand + " " + product_list[i].product_name + " : Price : " + product_list[i].price + " " + extra_text + "\n" + "\n";
        }

        console.log("Response is : " + response);
        return response;
    }
}

async function seacrchChargingStrip(productName, category) {
    let product_name = productName.toUpperCase();
    let sheetName = "Charging Strip";
    let products = await readExcelSheetData(sheetName = sheetName);
    let product_list = [];
    let index = 0;
    let response = "";
    
    for (let i = 0; i < products.length; i++) {
        let product = products[i][1].toString().toUpperCase();
        if (product.includes(product_name) && products[i][3] >= 1) {
            console.log("Product name is : " + products[i][1]);
            product_list[index] = { product_name: products[i][1], price: products[i][2], type: products[i][0] };
            product_list.push(product_list[index]);
        } else if (product.includes(productName) && products[i][3] <= 0) {
            product_list[index] = { product_name: products[i][1], price: "Not in Stock" };
            product_list.push(product_list[index]);
            console.log("Product name is : " + products[i][1]);
        }
        index++;
    }
    
    product_list = product_list.filter(function (el) {
        return el != null;
    });
    
    product_list.pop();

    if (product_list.length == 0) {
        console.log("Not in Stock");
        return "Not in Stock";
    } else {
        for (let i = 0; i < product_list.length; i++) {
            let extra_charging_text = "";
            if (product_list[i].type != undefined) {
                extra_charging_text = extra_charging_text + " " + "" + product_list[i].type + "";
            }
            response = response + product_list[i].product_name + " : Price " + product_list[i].price + " " + extra_charging_text + "\n" + "\n";
        }
        return response;
    }
}

async function seacrchBattery(productName, category, brand) {
    let product_name = productName.toUpperCase();
    let sheetName = "Battery";
    const products = await readExcelSheetData(sheetName = sheetName);
    console.log("Inside Battery Search Model, looking for " + product_name);
    let product_list = [];
    let index = 0;
    let response = "";
    
    for (let i = 0; i < products.length; i++) {
        let product = products[i][1].toString().toUpperCase();
        if (product.includes(product_name) && products[i][3] <= 0) {
            console.log(product_name);
            product_list[index] = { product_name: products[i][1], price: "Not in Stock", brand: products[i][0] };
            product_list.push(product_list[index]);
            console.log("Product name is : " + products[i][1]);
            product_list.push(product_list[index]);
            index++;
        } else if (product.includes(productName) && products[i][3] >= 1) {
            product_list[index] = { product_name: products[i][1], price: products[i][2], brand: products[i][0] };
            product_list.push(product_list[index]);
            index++;
        }
    }
    
    product_list = product_list.filter(function (el) {
        return el != null;
    });
    
    product_list.pop();

    if (product_list.length == 0) {
        return "Not in Stock";
    } else {
        for (let i = 0; i < product_list.length; i++) {
            let extra_text = "";
            if (product_list[i].brand != undefined) { extra_text = extra_text + " " + "(" + product_list[i].brand + ")"; }
            response = response + product_list[i].product_name + " : Price " + product_list[i].price + " " + extra_text + "\n" + "\n";
        }
        return response;
    }
}

bot.use(async (ctx, next) => {
    console.log("Inside use function");
    console.log(ctx.from);
    const userExists = await checkUserLogin(ctx.chat.id);
    if (!userExists) {
        if (UserData.getUserStatus(ctx.chat.id) == "NOT_REGISTERED") {
            console.log(UserData.getUserStatus(ctx.chat.id));
            await registerUser(ctx.chat.id);
        } else if (UserData.getUserStatus(ctx.chat.id) == "WAITING_FOR_PHONE_NUMBER" && ctx.updateType == "message") {
            let phone_number = ctx.message.text;
            console.log(phone_number);
            if (phone_number.startsWith("+91")) {
                phone_number = phone_number.slice(3);
            } else if (phone_number.startsWith("0")) {
                phone_number = phone_number.slice(1);
            }
            
            if (phone_number.length == 10 && (phone_number.startsWith("6") || phone_number.startsWith("7") || phone_number.startsWith("8") || phone_number.startsWith("9"))) {
                const users = await readExcelSheetData("Users");
                console.log("Number of row are : " + users.length);
                let row_number = users.length + 1;
                console.log("Rows are : " + users);
                forwardRequestToAdmin(ctx.chat.id, phone_number);
                bot.telegram.sendMessage(ctx.chat.id, "You request has been sent to the admin. You will be notified once your request is accepted");
            } else {
                bot.telegram.sendMessage(ctx.chat.id, "Please enter a valid phone number");
            }
        }
    }

    if (ctx.message != undefined) {
        ctx.state.updateType = "message";
    } else {
        ctx.state.updateType = "callback_query";
    }

    if (userExists && ctx.state.updateType == 'callback_query') {
        console.log("Inside callback query");
        var chat_id = ctx.from.id;
        console.log(ctx.update.callback_query.data);
        
        if (ctx.update.callback_query.data == "Combo" || ctx.update.callback_query.data == "Charging Strip" || ctx.update.callback_query.data.includes("Accept") || ctx.update.callback_query.data.includes("Reject")) {
            {
                UserData.setCategory(chat_id, ctx.update.callback_query.data);
                console.log("Category is : " + UserData.getCategory(chat_id));
                if (UserData.getCategory(chat_id) == "Combo") {
                    let brand = await askUserBrand(ctx, ctx.update.callback_query.data);
                    UserData.setBrand(chat_id, brand);
                    UserData.setBrandRead(chat_id, brand);
                } else if (UserData.getCategory(chat_id) == "Charging Strip") {
                    await askUserBrand(ctx, ctx.update.callback_query.data);
                } else if (UserData.getCategory(chat_id) == "Battery") {
                    bot.telegram.sendMessage(ctx.chat.id, 'Please enter the model name in the following format : \n <b>Brand Name</b> <i>Model Name</i> \n\n For example : \n <b>(TOTAL)</b> <i>4C BATT</i>', { parse_mode: 'HTML' });
                    await askUserBrand(ctx, ctx.update.callback_query.data);
                } else if (UserData.getCategory(chat_id) == "FRAME") {
                    ctx.reply("Coming Soon...");
                } else if (UserData.getCategory(chat_id) == "BACK PANELS") {
                    ctx.reply("Coming Soon..");
                } else if (ctx.update.callback_query.data.toString().includes("Accept")) {
                    console.log("Inside Accept");
                    let chat_id = ctx.update.callback_query.data.split("_")[1];
                    let phone_number = ctx.update.callback_query.data.split("_")[2];
                    console.log("Accepted request for " + chat_id + " " + phone_number);
                    let users = await readExcelSheetData("Users");
                    await enterUserDetails(phone_number, chat_id, users.length + 1);
                    bot.telegram.sendMessage(chat_id, "You have been registered successfully. You can now start using the bot");
                } else if (ctx.update.callback_query.data.toString().includes("Reject")) {
                    console.log("Inside Reject");
                    let chat_id = ctx.update.callback_query.data.split("_")[1];
                    let phone_number = ctx.update.callback_query.data.split("_")[2];
                    console.log("Rejected request for " + chat_id + " " + phone_number);
                    bot.telegram.sendMessage(chat_id, "Sorry! Your request has been rejected. Please contact the admin for more details");
                }
            }
        } else if (ctx.update.callback_query.data == "Yes") {
            console.log("Inside Yes");
            await askUserBrand(ctx, "Combo");
        } else if (ctx.update.callback_query.data == "No") {
            bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service. \n Please view some of our other products by clicking on the below link : \n\n <a href="https://drive.google.com/drive/folders/1sFOIEtquVmnsLOIcEmiq8uxsnRFmaVKH?usp=drive_link">Accesories</a> \n\n', { parse_mode: 'HTML' });
        } else if (ctx.update.callback_query.data == "OTHER PRODUCTS") {
            await searchOptherCategories(ctx);
            let conversation_id = ctx.update.message.chat.id;
        } else if (ctx.update.callback_query.data == "END CONVERSATION") {
            bot.telegram.sendMessage(ctx.chat.id, 'Thank you for using our service. Hope You had a pleasant experience');
        } else if ((await getBrandList("Combo")).includes(ctx.update.callback_query.data)) {
            console.log("Inside brand list");
            let conversation_id = ctx.update.callback_query.message.chat.id;
            UserData.setBrand(conversation_id, ctx.update.callback_query.data);
            UserData.setBrandRead(conversation_id, ctx.update.callback_query.data);
            console.log("Brand is : " + UserData.getBrand(conversation_id));
            ctx.reply("For brand : " + UserData.getBrand(conversation_id) + "\n Please enter ONLY the model number for example : '9a' or 'a12' or 's1 pro' or 'Nord ce2' or '9 power'");
            UserData.setCategory(conversation_id, "Combo");
        }
    } else if (userExists && ctx.state.updateType == "message" && !ctx.message.text.includes("start") && ctx.message.text != "/category" && ctx.message.text != "/help" && ctx.message.text != "/faq" && ctx.message.text != "/about" && ctx.message.text != "/channel_handler" && ctx.message.text != "/cat" && ctx.message.text != "/menu" && ctx.message.text != "/echo") {
        console.log("Inside message");
        let conversation_id = ctx.message.chat.id;
        console.log(ctx);

        if (ctx.message.text.toUpperCase().includes("HI") || ctx.message.text.toUpperCase().includes("HELLO") || ctx.message.text.toUpperCase().includes("HEY")) {
            UserData.setCategory(conversation_id, "None");
        }

        console.log("Category is : " + UserData.getCategory(conversation_id));
        if (UserData.getCategory(conversation_id) == "Combo") {
            console.log("Inside Combo************" + UserData.getCategory(conversation_id));
            let productName = ctx.message.text.toUpperCase();
            console.log("Model name is entered by user : " + productName);

            let brand_list = await getAlliasList();
            let new_product_name = productName;
            console.log('**************************', new_product_name);
            console.log("_________________________", UserData.getBrand(conversation_id));
            let brand_name = UserData.getBrand(conversation_id);
            let nameFound = false;
            for (let brand in brand_list) {
                if (productName.toString().includes(brand_list[brand]) && !nameFound) {
                    console.log(brand);
                    new_product_name = productName.replace(brand_list[brand], "");
                    console.log("Name of string after replacement " + new_product_name);
                    nameFound = true;
                }
            }
            
            new_product_name = new_product_name.replace(/\s/g, '');
            await ctx.replyWithChatAction("typing");
            let response = await seacrchCombo(new_product_name, brand_name);
            console.log("Response is : " + response);
            var phone_number = await getUserPhone(ctx.chat.id);
            let forwarded_message = "User : " + phone_number + "\n" + "Category :  Combo" + "\n" + "Product : " + brand_name + " " + productName + "\n" + "Response : " + response;

            if (response == "Not in Stock") {
                console.log("Model Not found ..");
                let res = await seacrchCombo(new_product_name, brand_name = undefined);
                let corrected_model = res;

                if (corrected_model == "Not in Stock") {
                    await ctx.reply("Not in Stock");
                    bot.telegram.sendMessage(5887384108, forwarded_message);
                    searchAnotherProductorEnd(ctx);
                } else {
                    await ctx.reply("I believe the spelling is incorrect, \n Below are simialr sounding models for other Companies... ");
                    console.log("Corrected model is : " + corrected_model);

                    if (corrected_model.length > 4096) {
                        for (let i = 0; i < corrected_model.length; i += 4096) {
                            await ctx.reply(corrected_model.slice(i, i + 4096));
                        }
                    } else {
                        await ctx.reply(corrected_model);
                    }
                }
            } else {
                if (response.length > 4096) {
                    for (let i = 0; i < response.length; i += 4096) {
                        await ctx.reply(response.slice(i, i + 4096));
                    }
                } else {
                    await ctx.reply(response);
                }
                searchAnotherProductorEnd(ctx);
                await logQueries(phone_number, ctx.message.text);
            }
        } else if (UserData.getCategory(conversation_id) == "Charging Strip") {
            console.log("Inside Charging Strip************");
            ctx.state.category_chosen = "None";
            let productName = ctx.message.text.toUpperCase();
            let brand_name = productName.split(" ")[0];
            let model_name = productName.replace(brand_name, "").trim();
            console.log("Model name is entered by user : " + model_name);
            let response = await seacrchChargingStrip(model_name);
            let forwarded_message = "User : " + ctx.message.from.username + "\n" + "Category :  Charging Strip" + "\n" + "Product : " + productName + "\n" + "Response : " + response;
            await ctx.reply(response);
            bot.telegram.sendMessage(6177576478, forwarded_message);
            searchAnotherProductorEnd(ctx);
            UserData.setCategory(conversation_id, "Charging Strip");
        } else if (UserData.getCategory(conversation_id) == "Battery") {
            console.log("Inside Battery************" + ctx.state.category_chosen);
            ctx.state.category_chosen = "None";
            let productName = ctx.message.text;
            let brand_name = productName.split(" ")[0];
            let model_name = productName.replace(brand_name, "").trim();
            console.log("Model name is entered by user : " + model_name);
            let response = await seacrchBattery(model_name, "Battery", brand_name);
            let forwarded_message = "User : " + ctx.message.from.username + "\n" + "Category :  Battery" + "\n" + "Product : " + productName + "\n" + "Response : " + response;
            await bot.telegram.sendMessage(ctx.chat.id, response);
            bot.telegram.sendMessage(6177576478, forwarded_message);
            searchAnotherProductorEnd(ctx);
            UserData.setCategory(conversation_id, "Battery");
        } else {
            console.log("Inside Normal Message************");
            await ctx.reply("Hello " + ctx.message.from.first_name + "\n Welcome to <b><i> VISHAL TELECOM's Online Assitance.</i></b> \n\nWe will help you find the price of the COMBO here.\n\n Please select the brand ..", { parse_mode: 'HTML' });
            await askUserBrand(ctx, "Combo");
        }
    }

    next(ctx);
});

bot.start(async (ctx) => {
    console.log(ctx.message.from.id);

    const args = ctx.message.text.split(' ');
    if (args.length > 1) {
        const argument = args[1];
        ctx.reply(`Below are the prices of brand : ${argument}`);
        var json_resp = await returnEntireSheet(argument);

        for (var key in json_resp) {
            await ctx.replyWithHTML("<b>" + key + "</b>", { parse_mode: 'HTML' });

            var response_txt = "";
            for (var i = 0; i < json_resp[key].length; i++) {
                response_txt = response_txt + json_resp[key][i] + "\n";
            }
            await ctx.reply(response_txt);
        }
    } else {
        ctx.reply('No argument was provided.');
    }
});

async function searchAnotherProductorEnd(ctx) {
    await bot.telegram.sendMessage(ctx.chat.id, 'Do you want to search another product?', {
        reply_markup: {
            inline_keyboard: [[{ text: 'Yes', callback_data: 'Yes' }], [{ text: 'No', callback_data: 'No' }]]
        }
    });
}

bot.command("category", async (ctx) => {
    const userExists = await checkUserLogin(ctx.chat.id);
    if (!userExists) {
        if (UserData.getUserStatus(ctx.chat.id) == "NOT_REGISTERED") {
            console.log(UserData.getUserStatus(ctx.chat.id));
            await registerUser(ctx.chat.id);
        }
    } else {
        console.log("Inside Cartegories");
        await askUserBrand(ctx, "Combo");
    }
});

// AWS Lambda Handler
export const handler = async (event, context, callback) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Parse the event body if it exists and is a string
        let update;
        if (event.body) {
            update = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else if (event.message || event.callback_query) {
            // Direct event format (testing)
            update = event;
        } else {
            console.log("No valid update found in event");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No update to process' })
            };
        }

        // Handle the Telegram update
        await bot.handleUpdate(update);

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
        };
    } catch (error) {
        console.error('Error handling update:', error);
        
        // Return error response
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error handling the update',
                error: error.message 
            })
        };
    }
}
