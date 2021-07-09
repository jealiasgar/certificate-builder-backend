let lighter = require("@orderstack/os-lighters")

lighter.glow(async () => {
	log.d(
		`Example Lighters Server Running env: ${JSON.stringify({
			mode: process.argv[2],
		})}`
	)
})
