import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Template dasar surat resmi IAI Jakarta.
// Dipakai untuk draft PDF yang bisa diunduh user untuk direview sebelum finalisasi.
// Final file (dengan nomor + QR) tetap di-upload manual ke fileFinalUrl per workflow di SYSTEM.md §5.2.

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
  header: {
    marginBottom: 24,
    borderBottom: 2,
    borderColor: "#000",
    paddingBottom: 12,
  },
  orgName: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
  orgSub: { fontSize: 10, textAlign: "center", marginTop: 2 },
  metaRow: { flexDirection: "row", marginTop: 24 },
  metaLabel: { width: 80 },
  metaValue: { flex: 1 },
  perihal: { marginTop: 12, fontWeight: "bold" },
  body: { marginTop: 24, textAlign: "justify" },
  footer: { marginTop: 48, alignItems: "flex-end" },
  qrRow: { flexDirection: "row", marginTop: 24, alignItems: "flex-end" },
  qrImage: { width: 80, height: 80 },
});

export type SuratKeluarPdfProps = {
  organisasi?: string;
  organisasiSub?: string;
  nomorSurat?: string | null;
  tanggalSurat: string;
  tujuan: string;
  tujuanAlamat?: string | null;
  perihal: string;
  isi: string;
  pejabatNama?: string;
  pejabatJabatan?: string;
  qrDataUrl?: string | null;
};

export function SuratKeluarDocument(props: SuratKeluarPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>
            {props.organisasi ?? "IKATAN AKUNTAN INDONESIA"}
          </Text>
          <Text style={styles.orgSub}>
            {props.organisasiSub ?? "Wilayah Jakarta"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Nomor</Text>
          <Text style={styles.metaValue}>
            : {props.nomorSurat ?? "(akan diisi)"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Tanggal</Text>
          <Text style={styles.metaValue}>: {props.tanggalSurat}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Kepada Yth.</Text>
          <Text style={styles.metaValue}>: {props.tujuan}</Text>
        </View>
        {props.tujuanAlamat ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}> </Text>
            <Text style={styles.metaValue}> {props.tujuanAlamat}</Text>
          </View>
        ) : null}

        <Text style={styles.perihal}>Perihal: {props.perihal}</Text>

        <View style={styles.body}>
          <Text>{props.isi}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Hormat kami,</Text>
          {props.qrDataUrl ? (
            <View style={styles.qrRow}>
              <Image src={props.qrDataUrl} style={styles.qrImage} />
              <View style={{ marginLeft: 16 }}>
                <Text style={{ marginTop: 40, fontWeight: "bold" }}>
                  {props.pejabatNama ?? "(Nama Pejabat)"}
                </Text>
                <Text>{props.pejabatJabatan ?? "(Jabatan)"}</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={{ marginTop: 48, fontWeight: "bold" }}>
                {props.pejabatNama ?? "(Nama Pejabat)"}
              </Text>
              <Text>{props.pejabatJabatan ?? "(Jabatan)"}</Text>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
