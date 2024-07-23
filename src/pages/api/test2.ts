import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const requestMethod = req.method;
    console.log("method=",req.method);
    console.log("query=",req.query);
    // http://localhost:3001/api/test2?gg=888 <-- query
    console.log("body=",req.body);
    const body = req.body;
    //const body = JSON.parse(req.body);
    switch (requestMethod) {
        case "POST":
            res
                .status(200)
                .json({ message: `You submitted the following data: ${body.fff} and ${req.query.gg}` });

        case "GET":
            res
            .status(200)
            .json({ message: `my answer is 100.` });
      
        default:
            res.status(200).json({ message: "Welcome to API Routes!" });
    }
}