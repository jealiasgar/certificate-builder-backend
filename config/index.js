// let fs = require('fs');
module.exports = {
	port: 1401, // defaults to 1337
	logs: {
		/* To enable logs from your app */
		app: true,
		error: true,
		lighters: true,
	},
	auth: {
		pwHashSecret:
			"4567uhfytdghsndjki9ijnasdfknjksfjkwenffzxcbhjeqbchjabfcys6298djskmbzvgvzmjxbsfaew665427i1u2hjhnedkjbscnb",
		jwtAccessTokenSigningParams: {
			expiresIn:
				60 *
				60 * // 1 hour
				800 * // 1 month
				6, // 6 months
			algorithm: "RS256",
		},
		superSecret:
			"7ujknbvcsazxfrfvhjio98765asfdmlkasnfkjebbdhcbajshfcxwedcvguiwekrltho9gf8iujwe2ebrgy6w78ue23ihref",
		refreshSuperSecret:
			"asdhbwujkqe3ydgvbqu23ydv78q23tgq237qfgdo672erc75qrd695231ri6e5d2i673re42157iwui3y2ergb237ge26783",
		/* How to generate keys 
			use git bash for windows
            0. ssh-keygen
            1. sudo ssh-keygen -p -m PEM -f <private_key_path_here>
            2. ssh-keygen -f ./<public_key_name>.pub -e -m pem >> ./<public_key_name>.pem
        
        */
		// AUTH ssh key path
		// THIS is required for JWT
		// privateKey: require('fs').readFileSync(projectDir + '/keys/ssekey', { encoding: 'utf-8' }),
		// publicKey: require('fs').readFileSync(projectDir + '/keys/ssekey-pub.pem', { encoding: 'utf-8' }),
	},
}
