import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { actions } = req.body; // array from previous step

  const errors = [];

  for (const action of actions) {
    const { course, field, value } = action;

    const { error } = await supabase
      .from("courses")
      .update({ [field]: value })
      .eq("course_name", course);

    if (error) errors.push({ course, field, error });
  }

  if (errors.length > 0) {
    return res.json({
      reply: "Some updates failed.",
      errors
    });
  }

  return res.json({
    reply: "Successfully applied all updates."
  });
}