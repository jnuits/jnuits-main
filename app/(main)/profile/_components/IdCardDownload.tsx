'use client'
import React, { useState } from 'react'

import {
  Circle,
  Document,
  Image,
  Line,
  Page,
  Path,
  Polyline,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import QRCodeLib from 'qrcode'

export interface IdCardProps {
  name: string
  membershipId?: string
  department?: string
  email: string
  phone?: string
  bloodGroup?: string
  photoUrl?: string
  validUntil?: string
  logoUrl?: string
}

interface IdCardDocumentProps extends IdCardProps {
  resolvedLogoUrl: string
  qrDataUrl: string
}

const styles = StyleSheet.create({
  // ── FRONT PAGE ──────────────────────────────────────────────
  page: {
    width: 153.07,
    height: 242.65,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#0f2d82',
    padding: '12 12 28 12',
    alignItems: 'center',
    position: 'relative',
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerAccent2: {
    position: 'absolute',
    bottom: 10,
    left: -10,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    justifyContent: 'center',
  },
  logoImage: { width: 26, height: 26, objectFit: 'contain' as const },
  logoTextWrap: { justifyContent: 'center' },
  orgName: {
    color: 'white',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },
  orgSub: { color: '#93c5fd', fontSize: 5, lineHeight: 1.4 },
  badge: {
    marginTop: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: 'white',
    fontSize: 4.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
  },
  wave: {
    position: 'absolute',
    bottom: -8,
    left: '-5%',
    width: '110%',
    height: 20,
    backgroundColor: 'white',
    borderRadius: 100,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  photoWrap: { alignItems: 'center', marginTop: -20 },
  photoRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8eeff',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5 solid #0f2d82',
  },
  photo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    objectFit: 'cover' as const,
  },
  photoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 5, color: '#6b9fff' },
  body: {
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 5,
    paddingBottom: 5,
    flex: 1,
  },
  memberName: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0c1e5c',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  idBadge: {
    marginTop: 3,
    backgroundColor: '#0f2d82',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  idBadgeText: {
    fontSize: 5,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  divider: {
    width: '100%',
    height: 0.5,
    backgroundColor: '#e0e7ff',
    marginVertical: 5,
  },
  infoGrid: { width: '100%', gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#eef1fb',
    alignItems: 'center',
    justifyContent: 'center',
    border: '0.5 solid #c7d3ff',
  },
  infoLabel: {
    fontSize: 3.8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 5.2, fontFamily: 'Helvetica-Bold', color: '#1f2937' },
  infoValueRed: {
    fontSize: 5.2,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  sigArea: {
    marginTop: 6,
    width: '100%',
    borderTop: '0.5 dashed #e5e7eb',
    paddingTop: 5,
    alignItems: 'center',
    marginBottom: 2,
  },
  sigName: {
    fontSize: 5.8,
    color: '#0c1e5c',
    fontFamily: 'Helvetica-BoldOblique',
  },
  sigLine: {
    width: 50,
    height: 0.5,
    backgroundColor: '#0c1e5c',
    marginVertical: 2,
  },
  sigLabel: { fontSize: 3.8, color: '#9ca3af', letterSpacing: 0.5 },

  // ── BACK PAGE (UNTOUCHED) ────────────────────────────────────
  backPage: {
    width: 153.07,
    height: 242.65,
    backgroundColor: '#f7f8ff',
    fontFamily: 'Helvetica',
  },
  topStripe: { height: 7, backgroundColor: '#1a3aad' },
  backBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  propertyTag: { fontSize: 5, color: '#9ca3af' },
  foundHeading: {
    marginTop: 7,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  backOrgName: {
    marginTop: 5,
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#1a3aad',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  addressBox: {
    marginTop: 7,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
  },
  addressText: {
    fontSize: 5.5,
    color: '#6b7280',
    lineHeight: 1.8,
    textAlign: 'center',
  },
  addressLink: {
    fontSize: 5.5,
    color: '#1a3aad',
    fontFamily: 'Helvetica-Bold',
  },
  qrWrap: {
    marginTop: 5,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 5,
  },
  qrCaption: {
    marginTop: 2,
    fontSize: 6,
    color: '#9ca3af',
    textAlign: 'center',
  },
  validStrip: {
    marginTop: 'auto',
    width: '100%',
    backgroundColor: '#1a6aad',
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  validText: {
    fontSize: 5.5,
    color: 'white',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
})

// ── Lucide-style SVG Icons for PDF ──────────────────────────────
const ICON_COLOR = '#0f2d82'
const ICON_SIZE = 9

const IconMembership = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="8"
      r="4"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
)

const IconDepartment = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
    <Rect
      x="2"
      y="7"
      width="20"
      height="14"
      rx="2"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
    />
    <Line
      x1="12"
      y1="12"
      x2="12"
      y2="16"
      stroke={ICON_COLOR}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="10"
      y1="14"
      x2="14"
      y2="14"
      stroke={ICON_COLOR}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

const IconBlood = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
    <Path
      d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"
      stroke="#dc2626"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
  </Svg>
)

const IconPhone = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const IconEmail = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
    <Rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
    />
    <Polyline
      points="2,4 12,13 22,4"
      stroke={ICON_COLOR}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// ── Back page QR (untouched)

const toDisplay = (value?: string) => (value && value.trim() ? value : 'N/A')

const IdCardDocument = ({
  name,
  membershipId,
  department,
  email,
  phone,
  bloodGroup,
  photoUrl,
  validUntil,
  resolvedLogoUrl,
  qrDataUrl,
}: IdCardDocumentProps) => {
  const safeName = toDisplay(name)
  const safeMembership = toDisplay(membershipId)
  const safeDepartment = toDisplay(department)
  const safeEmail = toDisplay(email)
  const safePhone = toDisplay(phone)
  const safeBlood = toDisplay(bloodGroup)
  const safeValid = toDisplay(validUntil)
  const uniName = 'Jagannath University'
  const club = 'IT Society (JnUITS)'

  const infoRows: {
    label: string
    value: string
    red: boolean
    Icon: () => React.ReactElement
  }[] = [
    {
      label: 'Membership',
      value: safeMembership,
      red: false,
      Icon: IconMembership,
    },
    {
      label: 'Department',
      value: safeDepartment,
      red: false,
      Icon: IconDepartment,
    },
    { label: 'Blood', value: safeBlood, red: true, Icon: IconBlood },
    { label: 'Phone', value: safePhone, red: false, Icon: IconPhone },
    { label: 'Email', value: safeEmail, red: false, Icon: IconEmail },
  ]

  return (
    <Document>
      {/* ── FRONT PAGE ── */}
      <Page size={[153.07, 242.65]} style={styles.page} wrap={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerAccent} />
          <View style={styles.headerAccent2} />
          <View style={styles.logoRow}>
            {resolvedLogoUrl && (
              <Image src={resolvedLogoUrl} style={styles.logoImage} />
            )}
            <View style={styles.logoTextWrap}>
              <Text style={styles.orgName}>{uniName}</Text>
              <Text style={styles.orgSub}>{club}</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MEMBERSHIP ID CARD</Text>
          </View>
          <View style={styles.wave} />
        </View>

        {/* Photo */}
        <View style={styles.photoWrap}>
          <View style={styles.photoRing}>
            {photoUrl ? (
              <Image src={photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>PHOTO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.memberName}>{safeName.toUpperCase()}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID-{safeMembership}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            {infoRows.map(({ label, value, red, Icon }) => (
              <View key={label} style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Icon />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={red ? styles.infoValueRed : styles.infoValue}>
                    {value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sigArea}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.sigName}>Imam Hasan</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>AUTHORISED SIGNATURE</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── BACK PAGE (UNTOUCHED) ── */}
      <Page size={[153.07, 242.65]} style={styles.backPage} wrap={false}>
        <View style={styles.topStripe} />
        <View style={styles.backBody}>
          <Text style={styles.propertyTag}>
            This card is the property of {club}
          </Text>
          <Text style={styles.foundHeading}>
            If found, please return it to{`\n`}the following address:
          </Text>
          <Text style={styles.backOrgName}>
            {uniName}
            {`\n`}
            {club}
          </Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>
              9, 10 Chittaranjan Ave, Dhaka -1100{`\n`}
              <Text style={styles.addressLink}>jnuitsbd@gmail.com</Text>
              {`\n`}
              <Text style={styles.addressLink}>www.jnuits.org.bd</Text>
            </Text>
          </View>
          <View style={styles.qrWrap}>
            {qrDataUrl && (
              <Image src={qrDataUrl} style={{ width: 55, height: 55 }} />
            )}
          </View>
          <Text style={styles.qrCaption}>Scan to verify membership</Text>
          <View style={styles.validStrip}>
            <Text style={styles.validText}>Valid up to {safeValid}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const toFilenameToken = (input?: string) =>
  (input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'member'

export default function IdCardDownload(props: IdCardProps) {
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  React.useEffect(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000'
    const url = `${origin}/profile/${props.membershipId}`
    QRCodeLib.toDataURL(url, { width: 110, margin: 1 }).then(setQrDataUrl)
  }, [props.membershipId])

  const handleDownload = async () => {
    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const resolvedPhotoUrl =
        props.photoUrl && props.photoUrl.startsWith('/')
          ? `${origin}${props.photoUrl}`
          : props.photoUrl

      const finalLogoUrl =
        props.logoUrl && props.logoUrl.startsWith('/')
          ? `${origin}${props.logoUrl}`
          : props.logoUrl || ''

      const blob = await pdf(
        <IdCardDocument
          {...props}
          photoUrl={resolvedPhotoUrl}
          resolvedLogoUrl={finalLogoUrl}
          qrDataUrl={qrDataUrl}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `JnUITS-ID_${toFilenameToken(props.membershipId || props.name)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF Generation Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-white via-blue-50/60 to-indigo-100/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase">
            JnUITS ID Card
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            Download Your Membership ID
          </h3>
          <p className="text-sm text-slate-600">
            PDF is generated from your profile details in real time.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1a3aad] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#132f8c] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? 'Generating PDF...' : 'Download ID Card'}
        </button>
      </div>
    </section>
  )
}
