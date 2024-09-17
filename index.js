const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/events', async (req, res) => {
    const icsUrl = 'https://0313010d.index-education.net/pronote/ical/mesinformations.ics?icalsecurise=D9E9B4181F3329CB4B54D8A7A0C91ACBB1EAB53323508926C35F249C43D9C09A70016BD26F35273FC09C9F8116207383&version=2024.2.6.1&param=266f3d32';

    try {
        const response = await axios.get(icsUrl);
        const data = response.data;
        const events = parseICS(data);
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        res.status(500).send('Erreur lors de la récupération des événements');
    }
});

function parseICS(data) {
    const events = [];
    const lines = data.split(/\r\n|\n/);
    let currentEvent = {};
    let isInEvent = false;

    lines.forEach((line) => {
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
            isInEvent = true;
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent.summary && currentEvent.startDate && currentEvent.endDate) {
                events.push(currentEvent);
            }
            isInEvent = false;
        } else if (isInEvent) {
            if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.replace('SUMMARY:', '').trim();
            } else if (line.startsWith('DTSTART:')) {
                currentEvent.startDate = formatDate(line.replace('DTSTART:', ''));
            } else if (line.startsWith('DTEND:')) {
                currentEvent.endDate = formatDate(line.replace('DTEND:', ''));
            }
        }
    });

    return events;
}

function formatDate(dateString) {
    const match = dateString.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!match) return 'Date non disponible';

    const [_, year, month, day, hour, minute] = match;
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' };
    return date.toLocaleString('fr-FR', options);
}

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
