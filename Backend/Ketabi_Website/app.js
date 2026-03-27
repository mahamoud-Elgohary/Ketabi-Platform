import express from "express";
import fs from "fs";
import path from "path";
import { warmCache } from "./utils/warmCache.js";
import authRoutes from "./routes/auth.js";
import genreRoutes from "./routes/genre.js";
import bookRouter from "./routes/book.js";
import ticketRoutes from "./routes/ticket.js";
import { connectMongoDB, connectRedisDB } from "./config/db.js";
import { swaggerDocs } from "./config/swagger.js";
import errorHandler from "./middlewares/errorHandler.js";
import cartRouter from "./routes/cart.js";
import orderRouter from "./routes/order.js";
import createSessionMiddleware from "./config/session.js";
import { morganLogger } from "./middlewares/morgan.js";
import profileRouter from "./routes/profile.js";
import { initializeIO } from "./socketIO/index.js";
import couponRouter from "./routes/coupon.js";
import publisherRoutes from "./routes/publisher.js";
import reviewRoutes from "./routes/review.js";
import adminRefundRoutes from "./routes/adminRefund.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import adminRoutes from "./routes/admin.js";
import helmet from "helmet";
import {
    cleanupOldCartsJob,
    couponExpirationJob,
    deleteUnconfirmedUsersJob,
    inactiveUserReminderJob,
    orderCleanupJob,
} from "./jobs/cronJobs.js";
import { defineCors } from "./middlewares/cors.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import salesRouter from "./routes/adminSales.js";
// import "./utils/telegramBot.js";
const bootstrap = async () => {
    const app = express();
    const PORT = process.env.PORT || 3000;
    const uploadsPath = path.resolve("uploads");
    if (!fs.existsSync(uploadsPath)) {
        // Ensure local uploads folder exists for file storage.
        fs.mkdirSync(uploadsPath, { recursive: true });
    }
    // *---MongoDB & Redis Connection---*
    await connectMongoDB();
    await connectRedisDB();
    // Stripe webhook route is intentionally disabled for local non-Stripe runs.
    // *---Middlewares---*
    app.use(express.json());
    app.use("/uploads", express.static("uploads"));
    defineCors(app);
    app.use(createSessionMiddleware());
    app.use(morganLogger);
    app.use(helmet());
    // Rate limiter disabled for local development/testing.
    // *---Routes---*
    app.use("/api/auth", authRoutes);
    app.use("/api/genres", genreRoutes);
    app.use("/api/books", bookRouter);
    app.use("/api/publishers", publisherRoutes);
    app.use("/api/cart", cartRouter);
    app.use("/api/orders", orderRouter);
    app.use("/api/users", profileRouter);
    app.use("/api/coupons", couponRouter);
    app.use("/api/tickets", ticketRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/admin/refunds", adminRefundRoutes);
    app.use("/api/admin/sales", salesRouter);
    app.use("/api/chatbot", chatbotRoutes);
    app.use("/api/admin", adminRoutes);
    swaggerDocs(app);
    // *---Error Handlers---*
    app.all("/{*dummy}", notFoundHandler);
    app.use(errorHandler);
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log("Telegram bot initialized");
        couponExpirationJob();
        deleteUnconfirmedUsersJob();
        inactiveUserReminderJob();
        cleanupOldCartsJob();
        orderCleanupJob();
        setTimeout(() => {
            warmCache().catch(console.error);
        }, 1000);
    });
    initializeIO(server);
};
export default bootstrap;
