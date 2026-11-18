// =================================================
// AGENTS — the options shown in the WhatsApp menu
// To add an agent, add another entry here.
// =================================================
module.exports = [
  {
    key: "1",
    name: "RM Assist Retail",
    aliases: ["retail", "rm retail", "rm assist retail"],
    url:
      process.env.RM_RETAIL_URL ||
      "https://presales.businessbywire.com/ambientflowgb8/flowAction/webhook/abea0b72-dfd1-4b13-a870-c5c0fd5e7d2f/9a7ce333-7943-4527-8989-c0224077bbb3",
  },
  {
    key: "2",
    name: "RM Assist Corporate",
    aliases: ["corporate", "rm corporate", "rm assist corporate"],
    url:
      process.env.RM_CORPORATE_URL ||
      "https://presales.businessbywire.com/ambientflowmeadg/flowaction/webhook/4dd0b4cb-0539-479a-825f-ef033e7075aa/89ce6440-7f66-4643-b652-45af456977a1",
  },
];
