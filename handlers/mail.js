const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');


const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateHTML = (filename, options = {}) => {
    //__dirname will be full path to this path like C:/folder/projectname/handlers
    // options will content reset value and email address
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inlined = juice(html);
    return inlined;
};


exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const textFromHtml = htmlToText.fromString(html);

    const mailOptions = {
        from: `Deividas <noreply@dave.com>`,
        to: options.user.email,
        subject: options.subject,
        html: html,
        text: textFromHtml
    };

    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);
};


//testing
// transport.sendMail({
//     from: 'Dave Puzer <papa@gmail.com>',
//     to: 'jane@example.com',
//     subject: 'Just try',
//     html: 'Hey I <strong>Love you</strong>',
//     text: 'Hey I Love you'
// });


