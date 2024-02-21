export type ICertificateRepository<TGenericClient> = {
  proxy: TGenericClient

  generateCertificate(userId: number, certificateFile: Buffer): Promise<void>

  findAllCertificates(): Promise<Buffer[] | null>
  findAllCertificatesByUserId(userId: number): Promise<Buffer[] | null>
  deleteCertificateById(certificateId: number): Promise<{ userId: number }>
}
