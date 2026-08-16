import {NextResponse} from "next/server";import {OPENAPI} from "@/server/openapi";export async function GET(){return NextResponse.json(OPENAPI,{headers:{"Cache-Control":"public, max-age=300"}})}
