// write a getter setter which gets stores and sets the value of a variable category

var category = {}
var brand = {}
var brandRead = {}
var comboBrands = {}
var batteryBrands = {}
var chargingStripBrands = {}

exports.setCategory = function (key, value) {
    category[key] = value
    }
exports.getCategory = function (key) {
    return category[key]
}
exports.setBrand = function (key, value) {
    brand[key] = value
    }
exports.getBrand = function (key) {
    return brand[key]
    }
exports.getbrandRead = function (key) {
    return brandRead[key]
}
exports.setBrandRead = function (key, value) {
    brandRead[key] = value
    }

exports.setComboBrands = function (key,value) {
    comboBrands[key]= value
    }
exports.getComboBrands = function (key) {
    return comboBrands[key]
    }
exports.setBatteryBrands = function (value,key) {
    batteryBrands[key] = value
    }
exports.getBatteryBrands = function (key) {
    return batteryBrands[key]
    }
exports.setChargingStripBrands = function (value,key) {
    chargingStripBrands[key] = value
    }
exports.getChargingStripBrands = function (key) {
    return chargingStripBrands[key]
    }
