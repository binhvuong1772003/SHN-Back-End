// Load environment variables before the queue workers initialize Redis/mailer.
import "@/config/env";
import "./email.worker";
import "./staff-invite.worker";

console.log("Email and staff-invite workers started");
