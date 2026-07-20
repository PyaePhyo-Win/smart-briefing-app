/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			...(process.env.NEXT_PUBLIC_PROFILE_IMAGE_HOST
				? [{
						protocol: process.env.NEXT_PUBLIC_PROFILE_IMAGE_PROTOCOL ?? "https",
						hostname: process.env.NEXT_PUBLIC_PROFILE_IMAGE_HOST,
						pathname: "/**",
					}]
				: []),
			{
				protocol: "http",
				hostname: "localhost",
				port: "9000",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "9000",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
