-- Merge duplicate manufacturer rows created by inconsistent casing/spacing
-- across the original CEC CSVs (e.g. "FOX ESS", "FOXESS", "FOXESS Co Ltd",
-- "FOXESS CO LTD" were four separate rows for the same company). This was
-- silently breaking search: a model attached to "FOX ESS" wouldn't be found
-- by anyone searching "FoxESS" as one word. Reassigns each duplicate's
-- equipment_models to the canonical row, then removes the duplicate.
update equipment_models set manufacturer_id = 'a710b408-d778-4c74-b0ae-ae4473f132c0' where manufacturer_id = 'aef21d03-d787-4cb9-a93d-8ba396c79cba';
delete from manufacturers where id = 'aef21d03-d787-4cb9-a93d-8ba396c79cba';
update equipment_models set manufacturer_id = '13268207-c143-48db-a826-7b160d9e1768' where manufacturer_id = 'c861b28f-89ae-480a-b770-b854f48d1f49';
delete from manufacturers where id = 'c861b28f-89ae-480a-b770-b854f48d1f49';
update equipment_models set manufacturer_id = 'fd2dd381-808d-4831-b016-601093e4e64c' where manufacturer_id = '33e62315-c152-4280-8e64-c690d0ed69ea';
delete from manufacturers where id = '33e62315-c152-4280-8e64-c690d0ed69ea';
update equipment_models set manufacturer_id = 'c2b00911-af42-4503-aabc-0a4d1edda8d5' where manufacturer_id = 'c0e3c5f1-9301-4cff-8635-8834dd99acaf';
delete from manufacturers where id = 'c0e3c5f1-9301-4cff-8635-8834dd99acaf';
update equipment_models set manufacturer_id = '10f13724-d8e0-481f-94b1-876e022c3c5a' where manufacturer_id = 'fc2749fc-5bc5-4dd4-a552-98f27bdd1966';
delete from manufacturers where id = 'fc2749fc-5bc5-4dd4-a552-98f27bdd1966';
update equipment_models set manufacturer_id = '3b2c8ed2-5cbe-46ad-984d-55b21f883251' where manufacturer_id = '25a5a962-faa4-45bb-aef0-3b15125b5305';
delete from manufacturers where id = '25a5a962-faa4-45bb-aef0-3b15125b5305';
update equipment_models set manufacturer_id = '11535ea1-6c30-4480-b6a3-7aaf5dd8c7cf' where manufacturer_id = '540e01e9-7f22-4a72-8b60-6eabde11c4bc';
delete from manufacturers where id = '540e01e9-7f22-4a72-8b60-6eabde11c4bc';
update equipment_models set manufacturer_id = 'c6465c5d-9e01-422e-86c6-67ee6d3af61c' where manufacturer_id = 'e548065f-e400-48f7-a154-d296cd4f2f23';
delete from manufacturers where id = 'e548065f-e400-48f7-a154-d296cd4f2f23';
update equipment_models set manufacturer_id = '332d0d4a-7111-437c-9ad5-e635e2a3811a' where manufacturer_id = '1cb3d42a-1ce0-4ccd-a5d5-d984795669fb';
delete from manufacturers where id = '1cb3d42a-1ce0-4ccd-a5d5-d984795669fb';
update equipment_models set manufacturer_id = '75c5b8c1-571c-4eac-b817-e0d01028cec2' where manufacturer_id = '46608ac3-79c2-43b2-a789-bc9ea1b16d1c';
delete from manufacturers where id = '46608ac3-79c2-43b2-a789-bc9ea1b16d1c';
update equipment_models set manufacturer_id = '058ae22d-cf44-4403-9675-d5d892f40270' where manufacturer_id = '0d8580e4-3cfe-460b-9f07-e40c96015691';
delete from manufacturers where id = '0d8580e4-3cfe-460b-9f07-e40c96015691';
update equipment_models set manufacturer_id = '058ae22d-cf44-4403-9675-d5d892f40270' where manufacturer_id = 'eed3165d-8b9a-4367-9b0f-b3737e24b919';
delete from manufacturers where id = 'eed3165d-8b9a-4367-9b0f-b3737e24b919';
update equipment_models set manufacturer_id = '405b974e-bf19-4b75-a6e6-364060610570' where manufacturer_id = '021ada5d-06d0-4d8c-9a58-3cc9497e0a6b';
delete from manufacturers where id = '021ada5d-06d0-4d8c-9a58-3cc9497e0a6b';
update equipment_models set manufacturer_id = '405b974e-bf19-4b75-a6e6-364060610570' where manufacturer_id = '1c487606-aa05-4f7a-9926-ff554df9e158';
delete from manufacturers where id = '1c487606-aa05-4f7a-9926-ff554df9e158';
update equipment_models set manufacturer_id = 'b56c77ca-4349-48d4-b4ba-e4ffe45bf78e' where manufacturer_id = '9b8e454d-6e0f-4f6f-ac4d-1d8cd9c539ab';
delete from manufacturers where id = '9b8e454d-6e0f-4f6f-ac4d-1d8cd9c539ab';
update equipment_models set manufacturer_id = '322565b7-354b-49ad-852e-53d08ea030d4' where manufacturer_id = '8a4155c0-f74e-4d41-94c8-26f9dc0a6a5c';
delete from manufacturers where id = '8a4155c0-f74e-4d41-94c8-26f9dc0a6a5c';
update equipment_models set manufacturer_id = '64deb103-6f97-4b91-99bd-050e5990a260' where manufacturer_id = '40a29886-53ae-4a01-973f-054121582af2';
delete from manufacturers where id = '40a29886-53ae-4a01-973f-054121582af2';
update equipment_models set manufacturer_id = '64deb103-6f97-4b91-99bd-050e5990a260' where manufacturer_id = 'aef8dcb1-8062-4560-816b-88795dec7753';
delete from manufacturers where id = 'aef8dcb1-8062-4560-816b-88795dec7753';
update equipment_models set manufacturer_id = '345b6c48-8dd9-445d-8ab7-9697a83015d1' where manufacturer_id = 'b87cacc9-350c-4169-ab3b-c4610b603a01';
delete from manufacturers where id = 'b87cacc9-350c-4169-ab3b-c4610b603a01';
update equipment_models set manufacturer_id = '6ca0be96-e99e-4980-b460-833b6c10414e' where manufacturer_id = '1c4f09cc-a6d2-4e8b-bf31-71594d51c4ee';
delete from manufacturers where id = '1c4f09cc-a6d2-4e8b-bf31-71594d51c4ee';
update equipment_models set manufacturer_id = 'd5e98e65-18bf-4ce6-a30b-eacc696dec66' where manufacturer_id = '9688246b-1e4f-4074-9ed9-e432fea26e05';
delete from manufacturers where id = '9688246b-1e4f-4074-9ed9-e432fea26e05';
update equipment_models set manufacturer_id = '04abd161-aa44-49a8-a7e0-da521dbdee34' where manufacturer_id = 'ebe3bfee-ef45-4d03-92ad-66ac11575e58';
delete from manufacturers where id = 'ebe3bfee-ef45-4d03-92ad-66ac11575e58';
update equipment_models set manufacturer_id = '0125d08f-73e5-4acb-bbda-56781d197985' where manufacturer_id = '312840bc-ed46-422b-a045-1aec8ee4f84c';
delete from manufacturers where id = '312840bc-ed46-422b-a045-1aec8ee4f84c';
update equipment_models set manufacturer_id = '0eb172ae-eced-42ad-b145-ac35af176768' where manufacturer_id = 'f42576b1-ab18-4e44-a405-0d84e770b0e7';
delete from manufacturers where id = 'f42576b1-ab18-4e44-a405-0d84e770b0e7';
update equipment_models set manufacturer_id = '2d145a5a-746b-411a-8501-aca447c8f98d' where manufacturer_id = '572cbfd7-5af3-4c2f-b934-8146f67962f8';
delete from manufacturers where id = '572cbfd7-5af3-4c2f-b934-8146f67962f8';
update equipment_models set manufacturer_id = '2a599e0f-d60f-4b4e-928d-e07ac024610c' where manufacturer_id = '71b619ec-0096-47da-850c-c450a54292c6';
delete from manufacturers where id = '71b619ec-0096-47da-850c-c450a54292c6';
update equipment_models set manufacturer_id = 'c376986d-e340-4a46-9daa-be7f2906df7e' where manufacturer_id = '08935482-27e1-4838-a7ab-4ddab83c892a';
delete from manufacturers where id = '08935482-27e1-4838-a7ab-4ddab83c892a';
