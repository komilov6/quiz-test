import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Language dictionaries
LANGUAGES = {
    'en': 'English',
    'ru': 'Русский',
    'uz': 'O\'zbek'
}

# Translations
TRANSLATIONS = {
    'en': {
        'welcome': "Hello {first_name}! 👋\n\nI'm your support bot. How can I help you today?\n\nUse the menu below to get help with common questions or type your specific issue.",
        'faq': "❓ FAQ",
        'contact': "📞 Contact Support",
        'feedback': "📝 Leave Feedback",
        'select_language': "🌐 Select Language / Выберите язык / Tilni tanlang",
        'language_selected': "Language changed to {language}",
        'faq_title': "❓ Frequently Asked Questions:\n\nSelect a question to see the answer:",
        'back_to_faq': "🔙 Back to FAQ",
        'main_menu': "🏠 Main Menu",
        'back_to_main': "🔙 Back to Main Menu",
        'contact_text': """📞 Contact Support:

• Email: support@example.com
• Phone: +1-800-123-4567 (24/7)
• Live Chat: Available through our website
• Ticket System: support.example.com/tickets

For urgent issues, please use phone or live chat.""",
        'feedback_text': """📝 Leave Feedback:

We appreciate your feedback! Please share your thoughts, suggestions, or report any issues you've encountered.

You can:
1. Describe your feedback in a message to this bot
2. Email us at feedback@example.com
3. Fill out our feedback form at feedback.example.com

Thank you for helping us improve!""",
        'thanks_message': "Thanks {first_name}! I've received your message: \"{message}\"\n\nOur support team will review it and get back to you soon.\n\nIs there anything else I can help you with?",
        'no_question': "Sorry, I don't have an answer for that question."
    },
    'ru': {
        'welcome': "Привет {first_name}! 👋\n\nЯ ваш бот поддержки. Как я могу вам помочь сегодня?\n\nИспользуйте меню ниже, чтобы получить помощь с распространенными вопросами или напишите ваш конкретный вопрос.",
        'faq': "❓ Часто задаваемые вопросы",
        'contact': "📞 Связаться с поддержкой",
        'feedback': "📝 Оставить отзыв",
        'select_language': "🌐 Выберите язык / Select Language / Tilni tanlang",
        'language_selected': "Язык изменен на {language}",
        'faq_title': "❓ Часто задаваемые вопросы:\n\nВыберите вопрос, чтобы увидеть ответ:",
        'back_to_faq': "🔙 Назад к FAQ",
        'main_menu': "🏠 Главное меню",
        'back_to_main': "🔙 Назад в главное меню",
        'contact_text': """📞 Поддержка:

• Email: support@example.com
• Телефон: +1-800-123-4567 (24/7)
• Чат в реальном времени: Доступен на нашем сайте
• Система заявок: support.example.com/tickets

Для срочных вопросов, пожалуйста, используйте телефон или чат в реальном времени.""",
        'feedback_text': """📝 Оставить отзыв:

Мы ценим ваш отзыв! Пожалуйста, поделитесь своими мыслями, предложениями или сообщите о любых проблемах, с которыми вы столкнулись.

Вы можете:
1. Описать свой отзыв в сообщении этому боту
2. Написать нам на feedback@example.com
3. Заполнить нашу форму обратной связи на feedback.example.com

Спасибо, что помогаете нам улучшаться!""",
        'thanks_message': "Спасибо {first_name}! Я получил ваше сообщение: \"{message}\"\n\nНаша команда поддержки рассмотрит его и скоро ответит.\n\nЕсть ли еще чем я могу вам помочь?",
        'no_question': "Извините, у меня нет ответа на этот вопрос."
    },
    'uz': {
        'welcome': "Salom {first_name}! 👋\n\nMen sizning yordamchi botingizman. Bugun sizga qanday yordam bera olaman?\n\nKo'p so'raladigan savollar bilan yordam olish yoki o'zingizning xususiy muammoingizni yozish uchun pastdagi menyudan foydalaning.",
        'faq': "❓ SSS",
        'contact': "📞 Yordam bilan bog'lanish",
        'feedback': "📝 Fikr bildirish",
        'select_language': "🌐 Tilni tanlang / Select Language / Выберите язык",
        'language_selected': "Til {language} ga o'zgartirildi",
        'faq_title': "❓ Ko'p so'raladigan savallar:\n\nJavobni ko'rish uchun savolni tanlang:",
        'back_to_faq': "🔙 SSS ga qaytish",
        'main_menu': "🏠 Bosh menyu",
        'back_to_main': "🔙 Bosh menyuga qaytish",
        'contact_text': """📞 Yordam bilan bog'lanish:

• Email: support@example.com
• Telefon: +1-800-123-4567 (24/7)
• Onlayn chat: Veb-saytimiz orqali mavjud
• Ariza tizimi: support.example.com/tickets

Shoshilinch muammolarda, iltimos, telefon yoki onlayn chatdan foydalaning.""",
        'feedback_text': """📝 Fikr bildirish:

Biz fikringizni juda qiymatlaymiz! Iltimos, o'zingizning fikrlaringizni, takliflaringizni yoki uchragan muammoingizni baham ko'ring.

Siz:
1. Bu botga xabar yuborib fikringizni izohlashingiz mumkin
2. feedback@example.com manzilga xabar yuborishingiz mumkin
3. feedback.example.com manzilidagi fikr bildirish formsini to'ldirishingiz mumkin

Bizni yaxshilashda yordam berganingiz uchun rahmat!""",
        'thanks_message': "Rahmat {first_name}! Men xabaringizni qabul qildim: \"{message}\"\n\nYordam jamoamiz xabarni ko'rib chiqadi va tezorada javob beradi.\n\nBoshqa nima bilan yordam bera olaman?",
        'no_question': "Kechirasiz, bu savolga javob yo'q."
    }
}

# FAQ data in different languages
FAQ = {
    'en': {
        "How to reset password": "To reset your password, go to Settings > Account > Password Reset and follow the instructions sent to your email.",
        "What are your business hours": "Our support team is available 24/7 for urgent issues. For general inquiries, we respond within 24 hours.",
        "How to contact support": "You can contact support through this bot, email at support@example.com, or call +1-800-123-4567.",
        "Where to find documentation": "Documentation is available at https://docs.example.com or through the Help section in our application."
    },
    'ru': {
        "Как сбросить пароль": "Чтобы сбросить пароль, перейдите в Настройки > Аккаунт > Сброс пароля и следуйте инструкциям, отправленным на вашу почту.",
        "Каков ваш график работы": "Наша команда поддержки доступна 24/7 для срочных вопросов. Для общих запросов мы отвечаем в течение 24 часов.",
        "Как связаться с поддержкой": "Вы можете связаться с поддержкой через этого бота, по электронной почте support@example.com, или позвонив по номеру +1-800-123-4567.",
        "Где найти документацию": "Документация доступна по адресу https://docs.example.com или в разделе Помощь в нашем приложении."
    },
    'uz': {
        "Parolni qalay tiklash": "Parolni tiklash uchun Sozlamalar > Hisob > Parolni tiklash bo'limiga kiriting va elektronngizga yuborilgan buyruqlarga rioya qiling.",
        "Ish vaqtingiz qanday": "Yordam jamoamiz shoshilinch muammolarda 24/7 mavjud, umumi so'rovlar uchun 24 soat ichida javob beramiz.",
        "Yordam bilan qanday bog'lanish": "Yordam bilan ushbu bot, support@example.com elektron pochta yoki +1-800-123-4567 telefon orqali bog'lanishingiz mumkin.",
        "Dokumentatsiya qayerda topiladi": "Dokumentatsiya https://docs.example.com manzilida yoki ilovamizning Yordam bo'limida mavjud."
    }
}

# Start command handler
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    
    # Get user's language from context or default to English
    lang = context.user_data.get('lang', 'en')
    t = TRANSLATIONS[lang]
    
    if user:
        welcome_message = t['welcome'].format(first_name=user.first_name)
    else:
        welcome_message = t['welcome'].format(first_name="there")
    
    keyboard = [
        [InlineKeyboardButton(t['faq'], callback_data='faq')],
        [InlineKeyboardButton(t['contact'], callback_data='contact')],
        [InlineKeyboardButton(t['feedback'], callback_data='feedback')],
        [InlineKeyboardButton(t['select_language'], callback_data='language')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(welcome_message, reply_markup=reply_markup)

# Help command handler
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    await start(update, context)

# Button callback handler
async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle button presses."""
    query = update.callback_query
    if query:
        await query.answer()
        
        if query.data == 'faq':
            await show_faq(query)
        elif query.data == 'contact':
            await show_contact(query)
        elif query.data == 'feedback':
            await show_feedback(query)
        elif query.data and query.data.startswith('faq_'):  # FAQ item selected
            await show_faq_answer(query, query.data[5:])  # Remove 'faq_' prefix
        elif query.data == 'back_to_main':
            await show_main_menu(query)

# Show FAQ menu
async def show_faq(query):
    """Show FAQ menu."""
    keyboard = []
    for question in FAQ.keys():
        keyboard.append([InlineKeyboardButton(question, callback_data=f'faq_{question}')])
    
    keyboard.append([InlineKeyboardButton("🔙 Back to Main Menu", callback_data='back_to_main')])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query.message:
        await query.edit_message_text(
            text="❓ Frequently Asked Questions:\n\nSelect a question to see the answer:",
            reply_markup=reply_markup
        )

# Show FAQ answer
async def show_faq_answer(query, question):
    """Show answer for selected FAQ question."""
    answer = FAQ.get(question, "Sorry, I don't have an answer for that question.")
    
    keyboard = [
        [InlineKeyboardButton("🔙 Back to FAQ", callback_data='faq')],
        [InlineKeyboardButton("🏠 Main Menu", callback_data='back_to_main')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query.message:
        await query.edit_message_text(
            text=f"❓ {question}\n\n💡 {answer}",
            reply_markup=reply_markup
        )

# Show contact information
async def show_contact(query):
    """Show contact information."""
    contact_text = """
📞 Contact Support:

• Email: support@example.com
• Phone: +1-800-123-4567 (24/7)
• Live Chat: Available through our website
• Ticket System: support.example.com/tickets

For urgent issues, please use phone or live chat.
    """
    
    keyboard = [
        [InlineKeyboardButton("🔙 Back to Main Menu", callback_data='back_to_main')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query.message:
        await query.edit_message_text(
            text=contact_text,
            reply_markup=reply_markup
        )

# Show feedback form
async def show_feedback(query):
    """Show feedback form."""
    feedback_text = """
📝 Leave Feedback:

We appreciate your feedback! Please share your thoughts, suggestions, or report any issues you've encountered.

You can:
1. Describe your feedback in a message to this bot
2. Email us at feedback@example.com
3. Fill out our feedback form at feedback.example.com

Thank you for helping us improve!
    """
    
    keyboard = [
        [InlineKeyboardButton("🔙 Back to Main Menu", callback_data='back_to_main')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query.message:
        await query.edit_message_text(
            text=feedback_text,
            reply_markup=reply_markup
        )

# Show main menu
async def show_main_menu(query):
    """Show main menu."""
    if query.message:
        user = query.from_user
        if user:
            welcome_message = f"""
Hello {user.first_name}! 👋

I'm your support bot. How can I help you today?

Use the menu below to get help with common questions or type your specific issue.
            """
        else:
            welcome_message = """
Hello! 👋

I'm your support bot. How can I help you today?

Use the menu below to get help with common questions or type your specific issue.
            """
        
        keyboard = [
            [InlineKeyboardButton("❓ FAQ", callback_data='faq')],
            [InlineKeyboardButton("📞 Contact Support", callback_data='contact')],
            [InlineKeyboardButton("📝 Leave Feedback", callback_data='feedback')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(welcome_message, reply_markup=reply_markup)

# Handle text messages (for feedback or general inquiries)
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming text messages."""
    if update.message and update.message.text:
        user_message = update.message.text
        user = update.effective_user
        
        # Simple response acknowledging receipt
        if user:
            await update.message.reply_text(
                f"Thanks {user.first_name}! I've received your message: \"{user_message}\"\n\n"
                "Our support team will review it and get back to you soon.\n\n"
                "Is there anything else I can help you with?"
            )
        else:
            await update.message.reply_text(
                f"Thanks! I've received your message: \"{user_message}\"\n\n"
                "Our support team will review it and get back to you soon.\n\n"
                "Is there anything else I can help you with?"
            )

# Error handler
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log the error."""
    logger.error("Exception while handling an update:", exc_info=context.error)

def main() -> None:
    """Start the bot."""
    # Get the bot token from environment variable or replace with your token
    # You can get a token from @BotFather on Telegram
    BOT_TOKEN = "8573825241:AAH0sniJCUIdNmLlLKGt0iAdI1y-PG61mrQ"  # Replace with your actual bot token
    
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CallbackQueryHandler(button))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Start the Bot
    print("Bot is starting...")
    application.run_polling()
    
    print("Bot stopped.")

if __name__ == '__main__':
    main()