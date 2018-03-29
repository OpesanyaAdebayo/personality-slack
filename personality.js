require('dotenv').config();
const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
const personality_insights = new PersonalityInsightsV3({
    username: process.env.PERSONALITY_INSIGHTS_USERNAME,
    password: process.env.PERSONALITY_INSIGHTS_PASSWORD,
    version_date: '2017-10-13'
});
const PersonalityTextSummaries = require('personality-text-summary');
const v3EnglishTextSummaries = new PersonalityTextSummaries({
    locale: 'en',
    version: 'v3'
});

let processTweets = (tweets) => {
    return new Promise((resolve, reject) => {
        let params = {
            content_items: tweets,
            consumption_preferences: true,
            raw_scores: true,
            headers: {
                'accept-language': 'en',
                'accept': 'application/json'
            }
        };
        personality_insights.profile(params, function (error, personalityProfile) {
            if (error && error.code == 400) {
                reject(Error("Ouch! You either do not have sufficient tweets, or your language is not supported. Sorry."));
            } else {
                var textSummary = v3EnglishTextSummaries.getSummary(personalityProfile);
                console.log(textSummary);
                // resolve(textSummary);
            }

        });

    });

};

module.exports = processTweets;