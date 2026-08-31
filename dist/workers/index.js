"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables before the queue workers initialize Redis/mailer.
require("../config/env");
require("./email.worker");
require("./staff-invite.worker");
console.log("Email and staff-invite workers started");
