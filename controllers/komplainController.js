const db = require("../models");
const Op = db.Sequelize.Op;
const Partner = db.Partner;
const OrderDetail = db.order_detail;
const Competitior = db.competitor;
const Branch = db.branch;
const PtnrMcid = db.ptnr_mcid;
const stringSimilarity = require("string-similarity");
const isBetween = require("dayjs/plugin/isBetween");

const ReviewCustomer = db.review_cust;
const FUDeactive = db.fu_deactive;

const FUMktCustomer = db.fu_mkt_customer;
const WeekRange = db.week_range;

const ListSalesBU = db.bu_list_sales;

const _ = require("lodash");
const dayjs = require("dayjs");
const axios = require("axios");

dayjs.extend(isBetween);

