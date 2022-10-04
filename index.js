const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;
  const filename = Key.split("/")[Key.split("/").length - 1];
  const ext = Key.split(".")[Key.split(".").length - 1];
  // sharp는 jpg는 처리 못 하고 jpeg만 처리 가능해서 바꿔주기
  const requiredFormat = ext === "jpg" || "JPG" ? "jpeg" : ext; 
  console.log("name", filename, "ext", ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기
    console.log("original", s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body) // 리사이징
      .resize(200, 200, { fit: "inside" })
      .toFormat(requiredFormat)
      .toBuffer();
    await s3
      .putObject({
        // resizingMimic 폴더에 저장
        Bucket,
        Key: `resizingMimic/${filename}`,
        Body: resizedImage,
      })
      .promise();
    console.log("put", resizedImage.length);
    // http 요청이 오면 res를 보내줘야 하므로 아래 callback이 의미가 있지만
    // s3로 요청할 경우 의미 그닥 없음
    return callback(null, `resizingMimic/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
