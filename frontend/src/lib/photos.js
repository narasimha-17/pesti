// Real photographs (Wikimedia Commons, CC-licensed). Files live in /public/img; attribution is listed on /credits.
import credits from '../data/photos.json'

export const photo = (key) => credits[key]?.file || null
export const photoCredits = credits
