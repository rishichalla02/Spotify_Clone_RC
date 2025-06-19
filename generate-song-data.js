// generate-song-data.js
import fs from 'fs/promises';
import path from 'path';

const publicDir = 'public';
const songsDir = path.join(publicDir, 'songs');

async function generateSongData() {
    console.log('Generating song data...');
    try {
        const folders = await fs.readdir(songsDir, { withFileTypes: true });

        for (const folder of folders) {
            if (folder.isDirectory()) {
                const folderPath = path.join(songsDir, folder.name);
                const files = await fs.readdir(folderPath);

                const mp3Files = files.filter(file => file.endsWith('.mp3'));

                // You can customize the title and description
                const title = `${folder.name} Songs`;
                const description = `A collection of ${folder.name.toLowerCase()} music.`;
                const artist = 'Various Artists'; // You might want to infer this from tags later

                const infoJsonContent = {
                    title: title,
                    description: description,
                    artist: artist,
                    songs: mp3Files // This array will be automatically generated
                };

                const infoJsonPath = path.join(folderPath, 'info.json');
                await fs.writeFile(infoJsonPath, JSON.stringify(infoJsonContent, null, 2));
                console.log(`Generated info.json for ${folder.name}`);
            }
        }
        console.log('Song data generation complete.');
    } catch (error) {
        console.error('Error generating song data:', error);
    }

    const folders = (await fs.readdir(songsDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const albumsData = {
        folders: folders // Store the list of folder names
    };

    // Write the master albums.json file
    await fs.writeFile(
        path.join(songsDir, 'albums.json'),
        JSON.stringify(albumsData, null, 4)
    );
    console.log('Generated albums.json with all folder names.');
}

// Call the function when the script is executed
generateSongData();